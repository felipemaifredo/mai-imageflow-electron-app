# Design System --- Mai ImageFlow

Este documento estabelece o sistema de design visual do aplicativo **Mai ImageFlow**. O design é inspirado na estética escura do macOS Tahoe, trazendo camadas translúcidas (glassmorphism), sombras suaves, cantos bem arredondados e tipografia limpa.

## Paleta de Cores

Todas as cores são declaradas como variáveis de CSS para garantir consistência visual em toda a aplicação.

```css
:root {
  /* Fundo e Superfície (macOS Tahoe Dark) */
  --bg-primary: #121214;       /* Cinza espacial profundo */
  --bg-secondary: #1a1a1e;     /* Painéis e cards de fundo */
  --surface-glass: rgba(30, 30, 34, 0.65); /* Efeito translúcido */
  --surface-hover: rgba(255, 255, 255, 0.06);
  --surface-active: rgba(255, 255, 255, 0.1);
  --border-glass: rgba(255, 255, 255, 0.08); /* Borda fina para efeito de vidro */
  
  /* Cores de Destaque (Accent - macOS Tahoe Blue) */
  --accent: #007aff;           /* Azul clássico Apple */
  --accent-hover: #1f8eff;
  --accent-active: #0062cc;
  --accent-transparent: rgba(0, 122, 255, 0.15);

  /* Status */
  --success: #34c759;          /* Verde iOS */
  --success-hover: #2cb04e;
  --warning: #ff9500;          /* Laranja iOS */
  --danger: #ff3b30;           /* Vermelho iOS */

  /* Cores de Texto */
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;   /* Cinza médio/claro */
  --text-muted: #71717a;       /* Cinza escuro/médio */
  --text-inverse: #ffffff;

  /* Efeitos de Sombra e Desfoque */
  --glass-blur: blur(20px);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.4);

  /* Bordas e Cantos (MacOS Tahoe - Cantos Arredondados) */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --radius-full: 9999px;

  /* Transições padrão */
  --transition-fast: 120ms cubic-bezier(0.25, 0.1, 0.25, 1);
  --transition-normal: 200ms cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

## Tipografia

O app utiliza a fonte **Roboto** por preferência do usuário, integrada com fallbacks nativos do sistema operacional para manter o aspecto nativo de app desktop.

- **Família de Fontes**: `'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Pesos Disponíveis**: 400 (Regular), 500 (Medium), 700 (Bold)
- **Hierarquia Visual**:
  - `h1` (Título da Janela/Principal): 20px, Bold, Cor: `var(--text-primary)`
  - `h2` (Títulos de Seção): 16px, Medium, Cor: `var(--text-primary)`
  - `h3` (Subseções/Grupos): 14px, Medium, Cor: `var(--text-secondary)`
  - `body` (Textos normais): 13px, Regular, Cor: `var(--text-secondary)`
  - `small` (Metadados/Legendas): 11px, Regular, Cor: `var(--text-muted)`

## Padrões de Layout

### Janela Glassmorphism (macOS Style)
Toda a interface deve dar a sensação de estar flutuando, utilizando bordas finas semi-transparentes e desfoque de fundo.

```css
.window-glass {
  background: var(--surface-glass);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
```

### Botões e Controles Interativos
Devem possuir micro-interações responsivas ao hover e active.

```css
.button-primary {
  background: var(--accent);
  color: var(--text-inverse);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-md);
  padding: 6px 12px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast), transform var(--transition-fast);
}

.button-primary:hover {
  background: var(--accent-hover);
}

.button-primary:active {
  background: var(--accent-active);
  transform: scale(0.98);
}
```
