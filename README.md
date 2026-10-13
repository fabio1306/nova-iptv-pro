# NOVA IPTV PRO - APLICATIVO IPTV PLAYER PARA SMART TV

**Nova IPTV Pro** é um aplicativo reprodutor IPTV completo, moderno e de alto desempenho, projetado especificamente para a experiência de televisão em Smart TVs (Samsung Tizen, LG webOS, Android TV, Fire TV e navegadores de TV).

Inspirado na usabilidade fluida de reprodutores renomados como **IBO Player**, **IBO Player Pro** e **IPTV Smarters Player Lite**, o aplicativo oferece navegação espacial completa por controle remoto, suporte a múltiplas contas, conexão por API Xtream Codes e listas M3U/M3U8, player HLS de baixa latência, TV ao vivo com guia EPG, catálogo de filmes (VOD), séries com episódios, favoritos persistentes, histórico de reprodução e temas visuais personalizáveis.

---

## 📺 Principais Funcionalidades

### 1. Interface & Navegação 10-Foot UI para Televisão
- **Navegação Integral por Controle Remoto (D-Pad)**: Setas (Cima, Baixo, Esquerda, Direita), OK (Enter), Voltar (Escape / Backspace), Play/Pause (Espaço), Teclas Coloridas (Vermelho, Verde, Amarelo, Azul) e Zapping de canais.
- **Anel de Foco Inteligente com Glow**: Destaque visual consistente e fluido com escalonamento suave e rolagem automática para o item selecionado.
- **Widget de Controle Remoto Virtual**: Controle em tela integrado para testes no computador ou acessibilidade.
- **Relógio Digital em Tempo Real**: Exibição da hora e data no topo da interface.

### 2. Gerenciamento Completo de Contas IPTV
- **Múltiplas Contas**: Cadastre e alterne entre diferentes contas sem reinstalar o aplicativo.
- **Xtream Codes API**:
  - Autenticação direta (`/player_api.php?username=...&password=...`).
  - Identificação de validade real (`exp_date`), dias restantes até a expiração, conexões ativas e limite de telas.
  - Indicadores visuais de status (🟢 Ativo, 🟡 Expira em Breve, 🔴 Expirado, ⚪ Validade Não Informada).
- **Listas M3U e M3U8**:
  - Conexão por URL remota com download e parser estruturado (`#EXTINF`, `#EXTGRP`, `tvg-logo`, `tvg-name`, `group-title`).
  - Importação de arquivos locais `.m3u` ou `.m3u8`.
- **Servidor Demonstração Pré-carregado**: Streams públicos, legais e funcionais (NASA TV, DW News, France 24, Red Bull Sports, Curtas da Fundação Blender) para testes imediatos sem necessidade de configuração prévia.
- **Ações Disponíveis**: Adicionar, Editar, Excluir (com modal de confirmação), Selecionar Ativa, Testar Conexão em tempo real e Atualizar Listas (sincronização).
- **Segurança de Credenciais**: Senhas mascaradas por padrão com botão para visualização temporária; armazenamento local protegido e seguro.

### 3. TV ao Vivo (Live TV)
- **Layout de 3 Colunas Otimizado para TV**:
  - Coluna 1: Categorias e gêneros (Notícias, Cinema, Esportes, Documentários, etc.) + categoria especial de Favoritos.
  - Coluna 2: Lista de canais com logotipo em alta resolução, numeração, nome e programa atual do EPG.
  - Coluna 3: Preview Player em tempo real (16:9), guia de programação detalhado (programa atual, próximo programa, barra de progresso) e botão para tela cheia.
- **Troca Rápida de Canais (Zapping)**: Troca instantânea por botões do controle remoto ou gaveta lateral dentro do próprio player.

### 4. Player de Vídeo Profissional (Hls.js + HTML5)
- **Compatibilidade**: Streams ao vivo HLS (`.m3u8`), transmissões MPEG-TS e vídeos MP4/MKV.
- **OSD Inteligente para TV**: Auto-ocultação após 4 segundos de inatividade; reaparece com qualquer tecla do controle.
- **Controles Completos**:
  - Play / Pause, Avanço (+10s), Retrocesso (-10s).
  - Barra de progresso com tempo decorrido e duração total para VODs.
  - Ajuste de proporção de aspecto (Ajustar, Preencher/Zoom, Esticar).
  - Controle de volume e modo mudo.
  - Gaveta de canais sobreposta para troca sem interromper a tela cheia.
  - Recuperação automática de quedas e botão de reconexão.
  - Retomada de reprodução (lembra exatamente o ponto onde o usuário parou em filmes e episódios).

### 5. Filmes (VOD) & Séries
- **Catálogo de Filmes**: Grade de pôsteres com classificação IMDb, ano, gênero, sinopse detalhada, backdrop cinematográfico e retomada de reprodução.
- **Catálogo de Séries**: Organização em temporadas (Temporada 1, 2, ...), lista de episódios com título, duração, sinopse e reprodução direta.

### 6. Pesquisa Global, Favoritos & Histórico
- **Busca Unificada**: Localiza canais de TV, filmes e séries em tempo real com filtros por aba.
- **Favoritos Persistentes**: Marque qualquer canal, filme ou série com estrela para acesso em tela dedicada.
- **Histórico**: Acompanhe os últimos conteúdos assistidos com data e botão "Continuar Assistindo".

### 7. Configurações & Personalização
- **Aparência**: 5 temas visuais refinados (**Sapphire**, **Emerald Glow**, **Crimson Velvet**, **Cyberpunk Purple**, **AMOLED Deep Black**), escala de interface (90% a 125%) e formato do relógio (24h/12h).
- **Reprodução**: Formato de stream padrão (Auto/HLS/TS), nível de buffer (Baixo para zapping rápido, Normal, Alto para conexões instáveis) e alternador de retomada automática.
- **Conexão & CORS**: Modo de Proxy configurável (Direto para Smart TVs nativas, ou Proxies CORS como CorsProxy.io para uso em navegadores comuns).
- **Geral**: Idioma (Português, Inglês, Espanhol), limpeza de cache e diagnóstico de conexão.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend Core**: HTML5 Semântico, CSS3 Moderno (Custom Properties, Flexbox, CSS Grid, Glassmorphism).
- **Lógica e Motor de Navegação**: Vanilla JavaScript modular (ES Modules).
- **Player Multimídia**: `Hls.js` + HTML5 Video MediaSource Extensions.
- **Navegação Espacial**: Algoritmo geométrico de foco D-Pad vetorial para controles remotos de Smart TV.
- **Build Tool**: Vite (empacotamento ultrarrápido com saída de arquivos estáticos puros).

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (v18+)
- NPM

### 1. Instalar Dependências
```bash
npm install
```

### 2. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
O aplicativo estará disponível em: `http://localhost:5173/`

### 3. Compilar para Produção (Build Estático)
```bash
npm run build
```
Os arquivos otimizados e prontos para distribuição em Smart TVs serão gerados na pasta `dist/`.

---

## 📺 Implantação em Smart TVs

Os arquivos gerados na pasta `dist/` são puramente estáticos (HTML, CSS e JS), tornando-os 100% compatíveis com qualquer plataforma de Smart TV:

### Samsung Smart TV (Tizen OS)
1. Crie o arquivo `config.xml` na raiz do pacote apontando para `dist/index.html`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<widget xmlns="http://tizen.org/ns/widgets" version="1.0.0" viewmodes="fullscreen">
    <tizen:application id="com.novaiptv.player" package="com.novaiptv" required_version="4.0"/>
    <content src="dist/index.html"/>
    <feature name="http://tizen.org/feature/screen.size.all"/>
    <tizen:privilege name="http://tizen.org/privilege/internet"/>
</widget>
```
2. Empacote com o Tizen Studio:
```bash
tizen package -t wgt -s <certificado> -- dist
tizen install -n NovaIPTV.wgt -t <IP_DA_TV>
```

### LG Smart TV (webOS TV)
1. Crie o arquivo `appinfo.json` na raiz da pasta `dist/`:
```json
{
  "id": "com.novaiptv.player",
  "version": "1.0.0",
  "vendor": "Nova IPTV",
  "type": "web",
  "main": "index.html",
  "title": "Nova IPTV Pro",
  "icon": "assets/icon.png",
  "largeIcon": "assets/largeIcon.png",
  "uiRevision": "2"
}
```
2. Empacote e instale via webOS CLI (Ares):
```bash
ares-package dist/
ares-install --device <NOME_DA_TV> com.novaiptv.player_1.0.0_all.ipk
```

### Android TV / Google TV / Fire TV
- Utilize Capacitor ou Apache Cordova para envelopar a pasta `dist/` em um APK nativo Android com WebView de aceleração de hardware:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Nova IPTV Pro" com.novaiptv.player --web-dir dist
npx cap add android
npx cap run android
```

---

## 🎮 Mapeamento de Teclas do Controle Remoto

| Botão do Controle TV | Tecla no Teclado | Função no Aplicativo |
| :--- | :--- | :--- |
| **Setas Direcionais** | `↑` `↓` `←` `→` | Navegação espacial entre botões e cartões |
| **OK / Enter** | `Enter` / `Espaço` | Confirmar seleção / Abrir item / Play |
| **Voltar (Back / Return)** | `Esc` / `Backspace` | Retornar para a tela anterior / Sair do player |
| **Canal Anterior / Próximo** | `PageUp` / `PageDown` | Zapping rápido de canais na TV ao Vivo |
| **Tecla Vermelha** | `F1` / `Key 403` | Atalho para TV ao Vivo |
| **Tecla Verde** | `F2` / `Key 404` | Atalho para Filmes |
| **Tecla Amarela** | `F3` / `Key 405` | Atalho para Séries |
| **Tecla Azul** | `F4` / `Key 406` | Atalho para Minha Conta / Configurações |

---

## 🔒 Segurança e Privacidade

- **Proteção de Credenciais**: Usuários e senhas de servidores são armazenados estritamente na memória local do dispositivo do usuário (LocalStorage / IndexedDB).
- **Sem Logs de Credenciais**: As senhas são mascaradas e nunca registradas no console ou em endpoints externos.
- **Isenção e Conformidade**: O aplicativo é um reprodutor de mídia neutro. Ele não inclui nem distribui streams proprietários protegidos por direitos autorais. O usuário é o único responsável pelas credenciais e listas inseridas.
