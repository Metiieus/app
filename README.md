# RPmon Dashboard

Sistema web completo para automatizar a criação e publicação de vídeos YouTube Shorts com temática Pokémon + RPG.

## 🎯 Objetivo

O RPmon Dashboard é uma plataforma que integra IA, síntese de voz, processamento de vídeo e agendamento automático para criar conteúdo de forma automatizada.

## 🚀 Tecnologias

### Frontend
- React 19 + TypeScript
- Tailwind CSS 4
- shadcn/ui (40+ componentes)
- tRPC Client
- React Query
- Recharts (gráficos)

### Backend
- Node.js + Express 4
- tRPC 11
- Drizzle ORM
- MySQL/TiDB
- Zod (validação)

### Integrações
- Gemini API (geração de roteiros)
- Edge TTS (síntese de voz)
- DALL-E (geração de imagens)
- YouTube API (publicação)
- FFmpeg (montagem de vídeo)
- Pillow (geração de thumbnails)

## 📁 Estrutura do Projeto

```
app/
├── backend/           # Backend Node.js + Express + tRPC
│   ├── src/
│   │   ├── routers/   # Routers tRPC (videos, agendamentos, logs, etc)
│   │   ├── db/        # Configuração do Drizzle ORM
│   │   ├── server.ts  # Servidor Express
│   │   └── trpc.ts    # Configuração tRPC
│   ├── tests/         # Testes unitários (Vitest)
│   └── package.json
├── database/          # Schema do banco de dados
│   └── schema.ts      # Definição das 6 tabelas
├── shared/            # Tipos compartilhados
│   └── types/
├── src/               # Frontend React
│   ├── pages/         # 7 páginas do sistema
│   ├── components/    # Componentes reutilizáveis
│   ├── lib/           # Utilitários (tRPC, etc)
│   └── hooks/         # Custom hooks
└── package.json
```

## 🛠️ Instalação

### Pré-requisitos
- Node.js 20+
- MySQL 8.0+
- FFmpeg (opcional, para processamento de vídeo)

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/rpmon-dashboard.git
cd rpmon-dashboard
```

### 2. Configure o Backend

```bash
cd backend
cp .env.example .env
# Edite .env com suas configurações
npm install
```

### 3. Configure o Banco de Dados

```bash
# Crie o banco de dados no MySQL
mysql -u root -p -e "CREATE DATABASE rpmon_dashboard;"

# Execute as migrations
npm run db:migrate
```

### 4. Configure o Frontend

```bash
cd ..
npm install
```

### 5. Inicie o sistema

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd ..
npm run dev
```

O sistema estará disponível em:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- tRPC: http://localhost:3001/trpc

## 🔑 Configuração de APIs

Acesse a página **Configurações** no dashboard e configure:

1. **GEMINI_API_KEY**: Obtenha em [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **OPENAI_API_KEY**: Obtenha em [OpenAI Platform](https://platform.openai.com/api-keys)
3. **YOUTUBE_API_KEY**: Obtenha em [Google Cloud Console](https://console.cloud.google.com/)
4. **YOUTUBE_REFRESH_TOKEN**: Siga o [guia de OAuth2](https://developers.google.com/youtube/v3/guides/authentication)

## 📊 Funcionalidades

### Dashboard
- Estatísticas em tempo real
- Gráfico de tendências
- Ações rápidas

### Criar Vídeo
- Formulário intuitivo
- Geração de roteiro com IA
- Síntese de voz
- Geração de imagens (DALL-E)
- Barra de progresso

### Histórico
- Tabela com filtros
- Visualização de detalhes
- Player de vídeo integrado
- Ações: Repostar, Regenerar, Deletar

### Agendador
- Calendário visual
- Recorrência: Uma vez, Diária, Semanal, Mensal
- Lista de agendamentos
- Ativar/Pausar/Deletar

### Painel de Controle
- Logs em tempo real (atualiza a cada 5s)
- Filtros por tipo e etapa
- Exportação CSV
- Status do scheduler

### Configurações
- Gerenciamento de chaves de API
- Teste de conexão
- Histórico de alterações

### Teste de Módulos
- Teste individual de cada componente
- Medição de tempo de execução
- Visualização de output

## 🧪 Testes

```bash
cd backend
npm test
```

O sistema inclui 14+ testes unitários cobrindo:
- CRUD de vídeos
- CRUD de agendamentos
- Geração de logs
- Configurações de API

## 🚀 Deploy

### Build

```bash
# Frontend
npm run build

# Backend
cd backend
npm run build
```

### Deploy em Produção

1. Configure as variáveis de ambiente no servidor
2. Execute as migrations do banco de dados
3. Inicie o backend: `npm start`
4. Sirva o frontend (pasta `dist/`) com nginx ou similar

## 📝 Documentação Adicional

- [Guia de Uso](GUIA_USO.md) - Instruções detalhadas para usuários
- [Documentação Técnica](DOCUMENTACAO_COMPLETA.md) - Arquitetura e APIs

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido com ❤️ para a comunidade Pokémon + RPG.

---

**Versão**: 1.0.0  
**Última atualização**: Fevereiro 2026
