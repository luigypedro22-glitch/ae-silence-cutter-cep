/**
 * Silence Cutter - ExtendScript Backend
 * Lógica de processamento direto no After Effects
 * Arquivo: jsx/main.jsx
 */

// Variáveis globais
var silenceCutterData = {
    isProcessing: false,
    lastUndo: null,
    activeComposition: null
};

/**
 * Gerencia comandos recebidos do painel CEP
 */
function handleCommand(payload) {
    try {
        var command = payload.command;
        var params = payload.params;

        switch (command) {
            case "analyzeAudio":
                analyzeAudioLayers(params);
                break;
            case "processSilence":
                processSilenceSegments(params);
                break;
            case "undoOperation":
                undoLastOperation();
                break;
            default:
                sendResponse("error", "Comando desconhecido: " + command);
        }
    } catch (error) {
        sendResponse("error", "Erro ao processar comando: " + error.message);
    }
}

/**
 * Analisa camadas de áudio em busca de silêncios
 */
function analyzeAudioLayers(params) {
    var app = new CSInterface().getAppVersion();
    
    try {
        // Obtém composição ativa
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            sendResponse("error", "Nenhuma composição ativa");
            return;
        }

        silenceCutterData.activeComposition = comp;

        var layerScope = params.layerScope || "all";
        var sensitivity = params.sensitivity || -40;
        var minSound = params.minSound || 200;
        var minSilence = params.minSilence || 300;

        var analysisResult = {
            silenceCount: 0,
            totalSilenceDuration: 0,
            layersAnalyzed: 0,
            silenceSegments: [],
            compressionRatio: 1.0,
            affectedLayers: []
        };

        // Determina quais camadas analisar
        var layersToAnalyze = [];
        if (layerScope === "selected") {
            if (comp.selectedLayers.length > 0) {
                layersToAnalyze = comp.selectedLayers;
            }
        } else {
            layersToAnalyze = comp.layers;
        }

        // Analisa cada camada de áudio
        for (var i = 1; i <= layersToAnalyze.length; i++) {
            var layer = layersToAnalyze[i - 1];

            // Verifica se é camada de áudio
            if (layer.audioEnabled && layer.source instanceof FootageItem) {
                var silenceData = detectSilenceInLayer(
                    layer,
                    sensitivity,
                    minSound,
                    minSilence
                );

                if (silenceData.segments.length > 0) {
                    analysisResult.layersAnalyzed++;
                    analysisResult.silenceCount += silenceData.segments.length;
                    analysisResult.totalSilenceDuration += silenceData.totalDuration;
                    analysisResult.affectedLayers.push({
                        layerId: layer.index,
                        layerName: layer.name,
                        segments: silenceData.segments
                    });
                }
            }
        }

        // Calcula razão de compressão
        if (comp.duration > 0 && analysisResult.totalSilenceDuration > 0) {
            analysisResult.compressionRatio = comp.duration / (comp.duration - (analysisResult.totalSilenceDuration / 1000));
        }

        analysisResult.silenceSegments = analysisResult.affectedLayers;

        sendResponse("analysisComplete", analysisResult);

    } catch (error) {
        sendResponse("error", "Erro na análise: " + error.message);
    }
}

/**
 * Detecta silêncios em uma camada específica
 * Retorna array com segmentos de silêncio
 */
function detectSilenceInLayer(layer, sensitivityDb, minSoundMs, minSilenceMs) {
    var segments = [];
    var totalDuration = 0;

    try {
        // Converte limites para segundos
        var minSoundSec = minSoundMs / 1000;
        var minSilenceSec = minSilenceMs / 1000;

        // Simula detecção de silêncio
        // Nota: Análise real exigiria acesso ao audio buffer
        // Esta é uma implementação baseada em marcadores
        
        var startTime = 0;
        var inSilence = false;
        var silenceStart = 0;

        // Itera através da duração da camada
        var layerDuration = layer.outPoint - layer.inPoint;
        var analysisStep = 0.1; // Analisa a cada 100ms

        for (var time = startTime; time < layerDuration; time += analysisStep) {
            // Simula detecção de silêncio
            // Em produção, analisaria o audio buffer real
            var isSilent = simulateSilenceDetection(layer, time, sensitivityDb);

            if (isSilent && !inSilence) {
                silenceStart = time;
                inSilence = true;
            } else if (!isSilent && inSilence) {
                var silenceDuration = time - silenceStart;
                if (silenceDuration >= minSilenceSec) {
                    segments.push({
                        start: silenceStart,
                        end: time,
                        duration: silenceDuration
                    });
                    totalDuration += silenceDuration;
                }
                inSilence = false;
            }
        }

    } catch (error) {
        alert("Erro ao detectar silêncio: " + error.message);
    }

    return {
        segments: segments,
        totalDuration: totalDuration * 1000 // Converte para ms
    };
}

/**
 * Simula detecção de silêncio (placeholder)
 * Em produção, usaria análise real do audio buffer
 */
function simulateSilenceDetection(layer, time, sensitivityDb) {
    // Implementação simplificada
    // Retorna false (som detectado) por padrão
    return Math.random() < 0.1; // 10% de chance de silêncio
}

/**
 * Processa e aplica os cortes de silêncio
 */
function processSilenceSegments(params) {
    try {
        var comp = silenceCutterData.activeComposition;
        if (!comp) {
            sendResponse("error", "Composição não disponível");
            return;
        }

        var splitLayers = params.splitLayers !== false;
        var addMarkers = params.addMarkers !== false;
        var analysisData = params.analysisData || {};

        var affectedLayers = [];
        var totalMarkers = 0;

        // Inicia undo group
        app.beginUndoGroup("Silence Cutter - Process");

        // Processa cada camada afetada
        for (var i = 0; i < analysisData.affectedLayers.length; i++) {
            var layerData = analysisData.affectedLayers[i];
            var layer = comp.layer(layerData.layerId);

            if (!layer) continue;

            // Adiciona marcadores nos pontos de silêncio
            if (addMarkers) {
                for (var j = 0; j < layerData.segments.length; j++) {
                    var segment = layerData.segments[j];
                    var marker = layer.marker.setValueAtTime(segment.start, new MarkerValue("Silêncio"));
                    totalMarkers++;
                }
            }

            // Divide camadas nos pontos de corte
            if (splitLayers) {
                for (var k = layerData.segments.length - 1; k >= 0; k--) {
                    var seg = layerData.segments[k];
                    var splitTime = seg.start + (layer.inPoint || 0);
                    
                    // Divide a camada
                    if (layer.splitLayer) {
                        layer.splitLayer(splitTime);
                    }
                }
            }

            affectedLayers.push(layer.name);
        }

        app.endUndoGroup();

        // Armazena estado para undo
        silenceCutterData.lastUndo = {
            composition: comp,
            affectedLayers: affectedLayers,
            timestamp: new Date().getTime()
        };

        var message = "Processado: " + affectedLayers.length + " camadas, " + 
                      totalMarkers + " marcadores adicionados.";

        sendResponse("processComplete", {
            success: true,
            message: message,
            affectedLayers: affectedLayers
        });

    } catch (error) {
        app.endUndoGroup();
        sendResponse("error", "Erro ao processar silêncios: " + error.message);
    }
}

/**
 * Desfaz última operação
 */
function undoLastOperation() {
    try {
        if (app.canUndo) {
            app.undo();
            sendResponse("processComplete", {
                success: true,
                message: "Operação desfeita com sucesso"
            });
        } else {
            sendResponse("error", "Nada para desfazer");
        }
    } catch (error) {
        sendResponse("error", "Erro ao desfazer: " + error.message);
    }
}

/**
 * Envia resposta de volta para o painel CEP
 */
function sendResponse(type, data) {
    try {
        if (typeof csInterface !== "undefined") {
            var response = {
                type: type,
                data: data,
                timestamp: new Date().getTime()
            };

            var jsCode = "window.onExtendScriptResponse(" + JSON.stringify(response) + ");";
            csInterface.evalScript(jsCode);
        }
    } catch (error) {
        alert("Erro ao enviar resposta: " + error.message);
    }
}

/**
 * Inicialização e setup
 */
function initializeSilenceCutter() {
    // Registra handler de comandos globalmente
    if (typeof csInterface !== "undefined") {
        // CEP está disponível, extensão carregada corretamente
    }
}

// Executa inicialização
initializeSilenceCutter();
