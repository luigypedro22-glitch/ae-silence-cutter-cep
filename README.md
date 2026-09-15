# 🎬 Silence Cutter - Extensão CEP para After Effects

Ferramenta automatizada e intuitiva para o corte de silêncios no Adobe After Effects em formato de extensão CEP, capaz de identificar com precisão os trechos desprovidos de sinal sonoro.

## 📋 Características

✅ **Detecção Inteligente de Silêncios** - Analisa camadas de áudio com sensibilidade ajustável (-60dB a -20dB)  
✅ **Divisão Automática** - Divide camadas nos pontos de silêncio automaticamente  
✅ **Marcadores Inteligentes** - Adiciona marcadores (markers) nos pontos detectados  
✅ **Preview Antes de Aplicar** - Visualiza a análise antes de fazer alterações  
✅ **Interface Profissional** - Painel CEP moderno com design responsivo  
✅ **Suporte Multilayer** - Processa todas as camadas ou apenas a selecionada  
✅ **Desfazer Rápido** - Botão para reverter última operação  

---

## 🖥️ Requisitos

- **Adobe After Effects 2024+** (v19.0 ou superior)
- **Windows 10/11** ou **macOS 11+**
- **CEP 9.0+** (incluído no After Effects)

---

## 📦 Instalação

### **Opção 1: Instalação Manual (Desenvolvimento)**

#### **Windows:**

1. Localize a pasta de extensões do After Effects:
   ```
   C:\Users\[SEU_USUARIO]\AppData\Roaming\Adobe\Common\Media Cache Files\
   ```
   Ou acesse através do After Effects:
   ```
   Arquivo > Scripts > Revelar folder de scripts
   ```

2. Crie a seguinte estrutura:
   ```
   C:\Program Files\Adobe\Adobe After Effects 2024\Support Files\Plug-ins\
   ```

3. Cole a pasta `ae-silence-cutter-cep` aqui

#### **macOS:**

1. Navegue até:
   ```
   /Library/Application Support/Adobe/Common/Media Cache Files/
   ```

2. Ou copie para:
   ```
   /Applications/Adobe After Effects 2024/Plug-ins/
   ```

3. Cole a pasta `ae-silence-cutter-cep`

### **Opção 2: Ativar Modo Debug (Recomendado para Desenvolvimento)**

#### **Windows:**

1. Abra o Regedit (`Win + R` → `regedit`)
2. Navegue até:
   ```
   HKEY_CURRENT_USER\Software\Adobe\CSXS.11
   ```
3. Crie uma nova chave (se não existir):
   - **Nome:** `PlayerDebugMode`
   - **Tipo:** `String (REG_SZ)`
   - **Valor:** `1`

4. Reinicie o After Effects

#### **macOS:**

1. Abra Terminal
2. Execute:
   ```bash
   defaults write com.adobe.CSXS.11 PlayerDebugMode 1
   ```
3. Reinicie o After Effects

### **Opção 3: Instalação via .zxp (Distribuição)**

1. Empacotar a extensão (requer Adobe Extension Builder ou similar)
2. Duplo clique no arquivo `.zxp`
3. O instalador do After Effects irá processar

---

## 🚀 Como Usar

### **Acessar a Extensão:**

1. Abra o **After Effects**
2. Vá para: **Window** → **Extensions** → **Silence Cutter**
3. O painel CEP será aberto no seu workspace

### **Fluxo de Trabalho:**

#### **Passo 1: Configurar Sensibilidade**
- Ajuste o slider **"Sensibilidade (dB)"** entre -60 e -20 dB
- Valores mais altos (próximo a -20) = mais sensível, detecta silêncios mais curtos
- Valores mais baixos (próximo a -60) = menos sensível, ignora sons fracos

#### **Passo 2: Definir Timeouts**
- **Tempo mínimo de som:** Duração mínima para considerar como "som real" (default: 200ms)
- **Tempo mínimo de silêncio:** Duração mínima para cortar (default: 300ms)

#### **Passo 3: Escolher Escopo**
- **Apenas camada selecionada** - Processa só a camada que você selecionou
- **Todas as camadas de áudio** - Processa todas do projeto

#### **Passo 4: Preview**
1. Clique em **"👁️ Preview"**
2. Aguarde a análise completar
3. Veja o resultado em **"📊 Análise"** com:
   - Quantidade de silêncios detectados
   - Duração total de silêncio
   - Camadas analisadas
   - Taxa de compressão (quanto mais tempo economizará)

#### **Passo 5: Aplicar**
1. Se estiver satisfeito, clique em **"▶️ Processar"**
2. Escolha as ações:
   - ✓ **Dividir camadas** - Faz split nos pontos de silêncio
   - ✓ **Adicionar marcadores** - Marca os pontos
   - ✓ **Preview antes** - Valida antes de aplicar

#### **Passo 6: Desfazer (se necessário)**
- Clique em **"↶ Desfazer"** para reverter última operação

---

## 🔧 Arquitetura da Extensão

```
ae-silence-cutter-cep/
├── CSXS/
│   └── manifest.xml           # Configuração CEP (versões, tipo de painel)
├── jsx/
│   └── main.jsx               # ExtendScript (lógica After Effects)
├── html/
│   └── index.html             # Interface HTML5
├── css/
│   └── styles.css             # Estilos modernos
├── js/
│   └── script.js              # Comunicação CEP ↔ After Effects
└── README.md                  # Este arquivo
```

### **Fluxo de Comunicação:**

```
User Input (HTML/CSS/JS)
    ↓
JavaScript (script.js)
    ↓
CEP Bridge (csInterface)
    ↓
ExtendScript (main.jsx)
    ↓
After Effects DOM API
    ↓
Retorna resultado via onExtendScriptResponse()
```

---

## 🐛 Troubleshooting

### **Extensão não aparece no menu Window**

1. **Verifique o path das pastas** - Certifique-se que estão nos locais corretos
2. **Reinicie After Effects** completamente
3. **Verifique o manifest.xml** - Confirme que está bem formado
4. **Modo Debug** - Ative Player Debug Mode e verifique o console

### **Erro: "CEP Interface não disponível"**

1. Verifique se está usando **After Effects 2024+**
2. Tente desabilitar e reabilitar a extensão
3. Verifique a pasta de extensões

### **Análise retorna 0 silêncios**

1. Ajuste a sensibilidade para um valor menos restritivo (-50dB)
2. Reduza "Tempo mínimo de silêncio" para 200ms
3. Verifique se a camada realmente tem áudio

### **Divisão de camadas não funciona**

1. Confirme que o After Effects tem a camada desbloqueada
2. Verifique que não há keyframes críticos nos pontos de corte
3. Tente fazer manualmente um split para confirmar que a camada suporta

---

## 📝 Código de Produção - Notas de Implementação

### **JavaScript (script.js)**
- Gerencia interface do painel
- Valida inputs do usuário
- Comunica com ExtendScript via `csInterface.evalFile()`
- Processa respostas via callback `onExtendScriptResponse()`

### **ExtendScript (main.jsx)**
- `analyzeAudioLayers()` - Detecta silêncios
- `processSilenceSegments()` - Aplica cortes e marcadores
- `undoLastOperation()` - Desfaz ações
- Usa `app.beginUndoGroup()` para transações seguras

### **Tratamento de Erros**
- Try/catch em todas as operações
- Validação de composição ativa
- Verificação de seleção de camadas
- Feedback visual ao usuário

---

## 🎯 Próximas Melhorias

- [ ] Análise real do audio buffer (waveform)
- [ ] Preview de waveform no painel
- [ ] Fade in/out automático nos cortes
- [ ] Exportação de relatório de análise
- [ ] Presets de sensibilidade (Music, Podcast, Narration)
- [ ] Suporte a plugins de áudio de terceiros

---

## 📄 Licença

Esta extensão é fornecida como está para uso pessoal e profissional.

---

## 👨‍💻 Autor

Desenvolvido com ❤️ para otimizar seu fluxo de trabalho no After Effects.

**Versão:** 1.0.0  
**Compatibilidade:** After Effects 2024+  
**Última atualização:** 2024

---

## 🆘 Suporte

Para questões e bugs, abra uma issue no repositório GitHub.

---

**Happy Cutting! 🎬✂️**
