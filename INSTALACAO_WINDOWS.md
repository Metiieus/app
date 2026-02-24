# TikFactory — Guia de Instalação no Windows

Este guia explica como instalar e rodar o TikFactory no **Windows 10/11**.

---

## Pré-requisitos

### 1. Node.js 20+
Baixe e instale em: https://nodejs.org/en/download

Verifique a instalação:
```cmd
node --version
npm --version
```

### 2. Python 3.8+ (para Edge TTS — narração)
Baixe e instale em: https://www.python.org/downloads/windows/

> **Importante:** Marque a opção **"Add Python to PATH"** durante a instalação.

Instale o Edge TTS:
```cmd
pip install edge-tts
```

Teste a narração:
```cmd
python -m edge_tts --voice "pt-BR-AntonioNeural" --text "Teste de narração" --write-media teste.mp3
```

### 3. FFmpeg (para montagem de vídeo)

**Opção A — Via Winget (recomendado, Windows 10/11):**
```cmd
winget install Gyan.FFmpeg
```

**Opção B — Via Chocolatey:**
```cmd
choco install ffmpeg
```

**Opção C — Manual:**
1. Baixe em: https://ffmpeg.org/download.html → Windows builds
2. Extraia para `C:\ffmpeg`
3. Adicione `C:\ffmpeg\bin` ao PATH do sistema:
   - Pesquise "Variáveis de ambiente" no menu Iniciar
   - Em "Variáveis do sistema", edite `Path`
   - Adicione `C:\ffmpeg\bin`

Verifique:
```cmd
ffmpeg -version
```

### 4. MySQL 8.0+ (banco de dados)

**Opção A — MySQL Installer:**
Baixe em: https://dev.mysql.com/downloads/installer/

**Opção B — XAMPP (mais fácil para desenvolvimento):**
Baixe em: https://www.apachefriends.org/pt_br/index.html
- Inclui MySQL + interface visual phpMyAdmin

---

## Instalação do TikFactory

### 1. Clone o repositório
```cmd
git clone https://github.com/Metiieus/app.git
cd app
```

### 2. Configure o Backend

```cmd
cd backend
copy .env.example .env
```

Edite o arquivo `.env` com o Bloco de Notas ou VS Code:
```cmd
notepad .env
```

Preencha as variáveis:
```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=tikfactory

GEMINI_API_KEY=sua_chave_aqui
TIKTOK_CLIENT_KEY=sua_chave_aqui
TIKTOK_CLIENT_SECRET=seu_secret_aqui
TIKTOK_ACCESS_TOKEN=seu_token_aqui
```

Instale as dependências:
```cmd
npm install
```

### 3. Configure o Banco de Dados

Abra o MySQL (via XAMPP ou MySQL Workbench) e execute:
```sql
CREATE DATABASE tikfactory;
```

Ou via linha de comando:
```cmd
mysql -u root -p -e "CREATE DATABASE tikfactory;"
```

Execute as migrations:
```cmd
npm run db:migrate
```

### 4. Configure o Frontend

```cmd
cd ..
npm install
```

---

## Iniciando o Sistema

Abra **dois terminais (cmd ou PowerShell)**:

**Terminal 1 — Backend:**
```cmd
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```cmd
npm run dev
```

Acesse no navegador:
- **Dashboard**: http://localhost:5173
- **API**: http://localhost:3001

---

## Solução de Problemas

### Edge TTS não funciona
```cmd
# Verifique se Python está no PATH
python --version

# Reinstale o edge-tts
pip install --upgrade edge-tts

# Teste diretamente
python -m edge_tts --voice "pt-BR-AntonioNeural" --text "Olá mundo" --write-media teste.mp3
```

### FFmpeg não encontrado
```cmd
# Verifique se está no PATH
ffmpeg -version

# Se não estiver, adicione manualmente ao PATH (veja passo 3 acima)
```

### Erro de conexão com MySQL
```cmd
# Verifique se o MySQL está rodando
# No XAMPP: clique em "Start" no MySQL
# Verifique usuário e senha no arquivo .env
```

### Porta 3001 ou 5173 em uso
```cmd
# Encontre o processo usando a porta
netstat -ano | findstr :3001

# Encerre o processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F
```

### Erro de permissão no Node.js
Execute o terminal como **Administrador** (clique direito → "Executar como administrador").

---

## Configuração de APIs

Acesse o dashboard em http://localhost:5173 e vá em **Configurações**:

| API | Onde obter | Obrigatório |
|-----|-----------|-------------|
| Gemini AI | https://makersuite.google.com/app/apikey | ✅ Sim |
| TikTok Client Key | https://developers.tiktok.com | Para autopublicação |
| TikTok Client Secret | https://developers.tiktok.com | Para autopublicação |
| TikTok Access Token | OAuth2 via TikTok | Para autopublicação |
| OpenAI (DALL-E) | https://platform.openai.com/api-keys | Opcional |
| ElevenLabs | https://elevenlabs.io | Opcional |

---

## Build para Produção (Windows)

```cmd
# Frontend
npm run build

# Backend
cd backend
npm run build
npm start
```

---

**Versão**: 2.0.0 | **Sistema**: Windows 10/11
