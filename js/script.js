/**
 * Silence Cutter - JavaScript Frontend
 * Comunica entre o painel CEP e o ExtendScript do After Effects
 */

class SilenceCutter {
    constructor() {
        this.isProcessing = false;
        this.lastAnalysis = null;
        this.undoStack = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateSensitivityDisplay();
        this.logStatus("Interface carregada");
    }

    setupEventListeners() {
        // Sliders e inputs
        document.getElementById("sensitivity").addEventListener("input", (e) => {
            this.updateSensitivityDisplay();
        });

        // Botões
        document.getElementById("previewBtn").addEventListener("click", () => this.handlePreview());
        document.getElementById("processBtn").addEventListener("click", () => this.handleProcess());
        document.getElementById("undoBtn").addEventListener("click", () => this.handleUndo());

        // Listeners para resposta do ExtendScript
        this.setupExtendScriptBridge();
    }

    updateSensitivityDisplay() {
        const value = document.getElementById("sensitivity").value;
        document.getElementById("sensitivityValue").textContent = `${value} dB`;
    }

    /**
     * Comunica com ExtendScript via CEP
     */
    setupExtendScriptBridge() {
        // Callback para respostas do ExtendScript
        window.onExtendScriptResponse = (response) => {
            console.log("Response from ExtendScript:", response);

            if (response.type === "analysisComplete") {
                this.displayAnalysisResults(response.data);
            } else if (response.type === "processComplete") {
                this.handleProcessComplete(response.data);
            } else if (response.type === "error") {
                this.logError(response.message);
            } else if (response.type === "progress") {
                this.updateProgress(response.percent);
            }
        };
    }

    /**
     * Envia comando para ExtendScript
     */
    sendToExtendScript(command, params) {
        try {
            const payload = {
                command,
                params,
                timestamp: Date.now()
            };

            // Usando csInterface do CEP
            if (typeof csInterface !== "undefined") {
                const jsx = `handleCommand(${JSON.stringify(payload)})`;
                csInterface.evalFile(jsx);
            } else {
                console.warn("CEP Interface não disponível");
            }
        } catch (error) {
            console.error("Erro ao enviar para ExtendScript:", error);
            this.logError("Falha na comunicação com After Effects");
        }
    }

    /**
     * Preview da análise
     */
    handlePreview() {
        if (this.isProcessing) {
            this.logError("Processamento já em andamento");
            return;
        }

        this.isProcessing = true;
        this.logStatus("Analisando silêncios...");
        this.showProgress();

        const params = {
            sensitivity: parseInt(document.getElementById("sensitivity").value),
            minSound: parseInt(document.getElementById("minSound").value),
            minSilence: parseInt(document.getElementById("minSilence").value),
            layerScope: document.querySelector('input[name="layerScope"]:checked').value
        };

        this.sendToExtendScript("analyzeAudio", params);
    }

    /**
     * Processa e aplica cortes
     */
    handleProcess() {
        if (this.isProcessing) {
            this.logError("Processamento já em andamento");
            return;
        }

        if (!this.lastAnalysis) {
            this.logError("Execute um preview primeiro");
            return;
        }

        this.isProcessing = true;
        this.logStatus("Processando cortes...");
        this.showProgress();

        const params = {
            sensitivity: parseInt(document.getElementById("sensitivity").value),
            minSound: parseInt(document.getElementById("minSound").value),
            minSilence: parseInt(document.getElementById("minSilence").value),
            layerScope: document.querySelector('input[name="layerScope"]:checked').value,
            splitLayers: document.getElementById("splitLayers").checked,
            addMarkers: document.getElementById("addMarkers").checked,
            analysisData: this.lastAnalysis
        };

        this.sendToExtendScript("processSilence", params);
    }

    /**
     * Desfaz a última operação
     */
    handleUndo() {
        if (this.undoStack.length === 0) {
            this.logError("Nada para desfazer");
            return;
        }

        this.isProcessing = true;
        this.logStatus("Desfazendo operação...");

        this.sendToExtendScript("undoOperation", {});
    }

    /**
     * Exibe resultados da análise
     */
    displayAnalysisResults(data) {
        this.lastAnalysis = data;
        this.isProcessing = false;
        this.hideProgress();

        const infoBox = document.getElementById("infoBox");
        const resultDiv = document.getElementById("analysisResult");

        let html = `
            <strong>Silêncios encontrados:</strong> ${data.silenceCount || 0}<br>
            <strong>Duração total de silêncio:</strong> ${this.formatTime(data.totalSilenceDuration || 0)}<br>
            <strong>Camadas analisadas:</strong> ${data.layersAnalyzed || 0}<br>
            <strong>Taxa de compressão:</strong> ${(data.compressionRatio || 1).toFixed(2)}x
        `;

        resultDiv.innerHTML = html;
        infoBox.classList.remove("hidden");

        this.logStatus("Análise concluída. Pronto para processar.");
        this.updateButtonStates(true);
    }

    /**
     * Finaliza processamento
     */
    handleProcessComplete(data) {
        this.isProcessing = false;
        this.hideProgress();

        if (data.success) {
            this.logStatus(`✅ Processamento concluído! ${data.message}`);
            this.undoStack.push({
                timestamp: Date.now(),
                layerIds: data.affectedLayers
            });
            document.getElementById("undoBtn").disabled = false;
        } else {
            this.logError(`Erro: ${data.message}`);
        }
    }

    /**
     * Atualiza barra de progresso
     */
    updateProgress(percent) {
        const progressFill = document.getElementById("progressFill");
        progressFill.style.width = `${Math.min(100, percent)}%`;
    }

    showProgress() {
        document.getElementById("progressBar").classList.remove("hidden");
        document.getElementById("progressFill").style.width = "0%";
    }

    hideProgress() {
        document.getElementById("progressBar").classList.add("hidden");
    }

    updateButtonStates(analysisComplete) {
        document.getElementById("processBtn").disabled = !analysisComplete;
    }

    /**
     * Logging no painel de status
     */
    logStatus(message) {
        console.log(`[Status] ${message}`);
        document.getElementById("statusText").textContent = message;
    }

    logError(message) {
        console.error(`[Erro] ${message}`);
        document.getElementById("statusText").textContent = `❌ ${message}`;
    }

    /**
     * Utilitários
     */
    formatTime(ms) {
        const seconds = (ms / 1000).toFixed(2);
        return `${seconds}s`;
    }
}

// Inicializa quando a página carrega
document.addEventListener("DOMContentLoaded", () => {
    window.silenceCutter = new SilenceCutter();
});
