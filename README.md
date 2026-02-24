# TikFactory 🎬

**Máquina de vídeos automática para TikTok** — gera, narra, monta e publica vídeos virais no piloto automático.

## 🎯 O que é?

O TikFactory é uma plataforma full-stack que integra IA, síntese de voz, processamento de vídeo e agendamento automático para criar conteúdo viral para TikTok de forma totalmente automatizada.

Com ele você pode:
- Gerar roteiros virais com **Gemini AI** em segundos
- Criar narração realista com **Edge TTS** (voz brasileira pt-BR)
- Gerar imagens verticais **9:16** com **DALL-E**
- Montar vídeos **1080x1920** com **FFmpeg** + legendas animadas
- Publicar automaticamente via **TikTok API**
- Agendar publicações diárias, semanais ou mensais

## 🚀 Tecnologias

### Frontend
- React 19 + TypeScript
- Tailwind CSS 4
- shadcn/ui (40+ componentes)
- tRPC Client + React Query
- Recharts (gráficos)

### Backend
- Node.js + Express 4
- tRPC 11 + Zod
- Drizzle ORM + MySQL/TiDB
- node-cron (scheduler)

### Integrações
| Serviço | Uso | Obrigatório |
|---------|-----|-------------|
| Gemini AI | Geração de roteiros virais | ✅ Sim |
| Edge TTS | Síntese de voz em português | ✅ Sim |
| TikTok API | Publicação automática | Para autopublicação |
| DALL-E (OpenAI) | Geração de imagens 9:16 | Opcional |
| ElevenLabs | Narração ultra-realista | Opcional |
| FFmpeg | Montagem de vídeo | ✅ Sim |

## 📁 Estrutura do Projeto

```
app/
├── backend/                  # Backend Node.js + Express + tRPC
│   ├── src/
│   │   ├── routers/          # Routers tRPC (videos, agendamentos, pipeline, logs)
│   │   ├── db/               # Configuração Drizzle ORM
│   │   ├── server.ts         # Servidor + Scheduler automático
│   │   └── trpc.ts           # Configuração tRPC
│   ├── .env.example          # Variáveis de ambiente
│   └── package.json
├── database/
│   └── schema.ts             # Schema do banco (6 tabelas)
├── src/                      # Frontend React
│   ├── pages/                # 6 páginas (Home, Criar, Histórico, Agendador, Painel, Config)
│   ├── components/           # Layout, UI components
│   └── lib/                  # tRPC client
├── INSTALACAO_WINDOWS.md     # Guia completo para Windows
└── package.json
```

## 🛠️ Instalação

### Windows (recomendado)

Veja o guia completo: **[INSTALACAO_WINDOWS.md](INSTALACAO_WINDOWS.md)**

**Resumo rápido:**

```cmd
# 1. Instalar dependências do sistema
winget install Gyan.FFmpeg
pip install edge-tts

# 2. Clonar e configurar
git clone https://github.com/Metiieus/app.git
cd app
cd backend
copy .env.example .env
rem Edite .env com suas chaves de API
npm install

# 3. Banco de dados
mysql -u root -p -e "CREATE DATABASE tikfactory;"
npm run db:migrate

# 4. Frontend
cd ..
npm install

# 5. Iniciar (dois terminais)
cd backend && npm run dev   # Terminal 1
npm run dev                 # Terminal 2
```

### Linux/Mac

```bash
# Dependências
sudo apt-get install ffmpeg    # Ubuntu/Debian
brew install ffmpeg            # Mac
pip install edge-tts

# Instalar e rodar
git clone https://github.com/Metiieus/app.git && cd app
cd backend && cp .env.example .env
npm install && cd .. && npm install

# Banco de dados
mysql -u root -p -e "CREATE DATABASE tikfactory;"
cd backend && npm run db:migrate

# Iniciar
cd backend && npm run dev &
npm run dev
```

Acesse em:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🔑 Configuração de APIs

Acesse **Configurações** no dashboard e configure:

1. **GEMINI_API_KEY** — [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **TIKTOK_CLIENT_KEY** + **TIKTOK_CLIENT_SECRET** — [TikTok Developers](https://developers.tiktok.com)
3. **TIKTOK_ACCESS_TOKEN** — Gerado via OAuth2 do TikTok
4. **OPENAI_API_KEY** — [OpenAI Platform](https://platform.openai.com/api-keys) (opcional)
5. **ELEVENLABS_API_KEY** — [ElevenLabs](https://elevenlabs.io) (opcional)

## 📊 Funcionalidades

### 🏠 Dashboard
- Métricas em tempo real (vídeos, views, likes)
- Gráfico de produção dos últimos 7 dias
- Top nichos por performance
- Ações rápidas

### 🎬 Criar Vídeo
- 12 nichos disponíveis (Motivacional, Curiosidades, Finanças, etc.)
- Duração: 15s, 30s ou 60s
- Estilos de narração: Energético, Calmo, Dramático, Informativo
- Hook inicial personalizável
- Opções: Legendas animadas, Música trending, Efeitos visuais, Auto-publicar

### 📋 Histórico
- Tabela com filtros por status e busca
- Métricas TikTok (views, likes) por vídeo
- Preview do roteiro e hashtags
- Ações: Ver, Regenerar, Compartilhar, Deletar

### ⏰ Agendador
- Frequência: Uma vez, Diária, Semanal, Mensal
- Horários otimizados para TikTok (07h, 12h, 18h, 21h)
- Controle de pausa/ativação por agendamento
- Contador de vídeos gerados

### 🖥️ Painel de Controle
- Logs em tempo real do pipeline
- Filtros por tipo (info, sucesso, erro, aviso) e etapa
- Status da máquina de vídeos
- Exportação CSV

### ⚙️ Configurações
- Gerenciamento de todas as chaves de API
- Teste de conexão por chave
- Links diretos para obter cada chave

## 🔄 Pipeline de Geração

```
1. Roteiro (Gemini AI)
   ↓ Hook viral + roteiro otimizado para TikTok
2. Narração (Edge TTS)
   ↓ Voz brasileira pt-BR, estilo configurável
3. Imagens (DALL-E)
   ↓ Formato 9:16 (1080x1920), prompts por nicho
4. Vídeo (FFmpeg)
   ↓ MP4 1080x1920 30fps + legendas animadas
5. Thumbnail
   ↓ Capa atrativa gerada automaticamente
6. Publicação (TikTok API)
   ↓ Upload + hashtags + configurações de privacidade
```

## 🚀 Build para Produção

**Windows:**
```cmd
npm run build
cd backend && npm run build && npm start
```

**Linux:**
```bash
npm run build
cd backend && npm run build && npm start
```

## 📄 Licença

MIT License — veja [LICENSE](LICENSE) para detalhes.

---

**Versão**: 2.0.0 (TikTok Edition)
**Compatível com**: Windows 10/11, Linux, macOS
**Última atualização**: Fevereiro 2026
