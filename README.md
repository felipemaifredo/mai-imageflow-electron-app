# Mai ImageFlow

**Mai ImageFlow** é um aplicativo desktop moderno de processamento de imagens projetado com a estética *glassmorphic* inspirada na linha do macOS Tahoe. Desenvolvido em **Electron**, **React 19** e **Sharp**, ele oferece uma ferramenta eficiente para recortar, redimensionar, converter formatos e gerar múltiplos assets/ícones em lote de forma ágil e intuitiva.

---

## ✨ Funcionalidades Principais

- **Recorte Interativo (Crop)**: Ajuste livre ou com proporções travadas (1:1, 16:9, etc.) com pré-visualização de corte instantânea no painel central.
- **Configurações Multi-Saída**: Configure múltiplas versões de saída para a mesma imagem de uma só vez (ex: gere simultaneamente uma Thumbnail, uma versão em WebP para web e um ícone para desktop).
- **Geração de Ícones para Apps**: Opção inteligente para compilar todas as resoluções necessárias de ícone para plataformas e lojas (`16, 32, 48, 256, 512, 1024` pixels) nos formatos nativos `.ico` e `.icns` ou PNGs individuais.
- **Estruturação de Pastas Inteligente**:
  - Salva arquivos de saídas simples diretamente na pasta de destino com o sufixo `_edited` para evitar sobrescrever a imagem original.
  - Para saídas múltiplas ou ícones completos, cria uma pasta organizada por formatos (`/png/`, `/webp/`, `/ico/`, `/icns/`).
- **Performance Nativa**: Edição e compressão velozes utilizando processamento C++ nativo por meio da biblioteca `sharp`.

---

## 🛠️ Stack Tecnológica

- **Front-end**: React 19.2.1, Zustand (Gerenciamento de Estado), Lucide React (Ícones).
- **Aparência**: CSS Modules com Design System escuro translúcido (Glassmorphism) e fonte Roboto.
- **Desktop core**: Electron 39.2.6, Electron-Vite (Bundler e Dev Server).
- **Processamento de imagem**: Sharp 0.33.4, Png-To-Ico, Icon-Gen.

---

## 🚀 Como Iniciar o Desenvolvimento

### Pré-requisitos
Certifique-se de ter o **Node.js** instalado na sua máquina.

### 1. Instalar Dependências
Como o projeto utiliza o React 19, use a flag de dependências legadas do npm para instalação:
```bash
npm install --legacy-peer-deps
```

### 2. Executar em Modo de Desenvolvimento
Inicie o dev server do Vite e a janela do Electron:
```bash
npm run dev
```

### 3. Verificar Tipagens (TypeScript)
O projeto é altamente tipado e utiliza configurações separadas para o processo Main (Node) e Renderer (Web):
```bash
npm run typecheck
```

---

## 📦 Empacotamento para Produção (Build)

Para gerar o build de produção empacotado e pronto para distribuição com os instaladores locais (DMG/Zip no Mac, EXE/Portable no Windows) contendo os ícones oficiais configurados:

### Compilar para macOS (Gera DMG em `release/`)
```bash
npm run build:mac
```

### Compilar para Windows (Gera EXE em `release/`)
```bash
npm run build:win
```
