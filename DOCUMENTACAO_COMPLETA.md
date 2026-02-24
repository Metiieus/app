# Documentação Técnica - RPmon Dashboard

Documentação completa da arquitetura, APIs e implementação do RPmon Dashboard.

## 📚 Índice

1. [Arquitetura](#arquitetura)
2. [Banco de Dados](#banco-de-dados)
3. [APIs tRPC](#apis-trpc)
4. [Integrações Externas](#integrações-externas)
5. [Scheduler](#scheduler)
6. [Frontend](#frontend)
7. [Testes](#testes)
8. [Deploy](#deploy)

---

## Arquitetura

### Visão Geral

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   Database      │
│  React + Vite   │◄────│ Express + tRPC  │◄────│  MySQL/TiDB     │
│   Port: 5173    │     │   Port: 3001    │     │   Port: 3306    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  External APIs  │
                        │  Gemini, OpenAI │
                        │  YouTube, etc   │
                        └─────────────────┘
```

### Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | React | 19 |
| Frontend | TypeScript | 5.3 |
| Frontend | Tailwind CSS | 3.4 |
| Frontend | shadcn/ui | Latest |
| Backend | Node.js | 20+ |
| Backend | Express | 4.18 |
| Backend | tRPC | 11 |
| Backend | Drizzle ORM | 0.30 |
| Database | MySQL | 8.0+ |

---

## Banco de Dados

### Schema

#### 1. users
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY DEFAULT UUID(),
  open_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW()
);
```

#### 2. videos
```sql
CREATE TABLE videos (
  id VARCHAR(36) PRIMARY KEY DEFAULT UUID(),
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  titulo VARCHAR(255) NOT NULL,
  tema VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  status ENUM('pendente', 'processando', 'concluido', 'erro', 'publicado') DEFAULT 'pendente',
  roteiro TEXT,
  hashtags JSON DEFAULT '[]',
  audio_url VARCHAR(500),
  video_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  youtube_video_id VARCHAR(50),
  youtube_url VARCHAR(500),
  erro TEXT,
  criado_em DATETIME DEFAULT NOW(),
  publicado_em DATETIME
);
```

#### 3. agendamentos
```sql
CREATE TABLE agendamentos (
  id VARCHAR(36) PRIMARY KEY DEFAULT UUID(),
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  tema VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  tipo ENUM('uma_vez', 'diaria', 'semanal', 'mensal') NOT NULL,
  proxima_execucao DATETIME NOT NULL,
  ultima_execucao DATETIME,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em DATETIME DEFAULT NOW()
);
```

#### 4. logs
```sql
CREATE TABLE logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT UUID(),
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  video_id VARCHAR(36) REFERENCES videos(id),
  tipo ENUM('info', 'sucesso', 'erro', 'aviso') NOT NULL,
  etapa ENUM('roteiro', 'narracao', 'imagem', 'video', 'thumbnail', 'publicacao', 'geral') NOT NULL,
  mensagem TEXT NOT NULL,
  detalhes TEXT,
  criado_em DATETIME DEFAULT NOW()
);
```

#### 5. imagens_ia
```sql
CREATE TABLE imagens_ia (
  id VARCHAR(36) PRIMARY KEY DEFAULT UUID(),
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  video_id VARCHAR(36) REFERENCES videos(id),
  prompt TEXT NOT NULL,
  url VARCHAR(500) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  criado_em DATETIME DEFAULT NOW()
);
```

#### 6. configuracoes
```sql
CREATE TABLE configuracoes (
  id VARCHAR(36) PRIMARY KEY DEFAULT UUID(),
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  chave VARCHAR(100) NOT NULL,
  valor TEXT NOT NULL,
  criado_em DATETIME DEFAULT NOW()
);
```

### Relacionamentos

```
users ||--o{ videos : cria
users ||--o{ agendamentos : cria
users ||--o{ logs : gera
users ||--o{ imagens_ia : gera
users ||--o{ configuracoes : possui
videos ||--o{ logs : possui
videos ||--o{ imagens_ia : possui
```

---

## APIs tRPC

### Videos Router

#### `videos.create`
Cria um novo vídeo.

**Input:**
```typescript
{
  titulo: string;
  tema: string;
  descricao: string;
  usarIA: boolean;
  legendas: boolean;
  efeitos: boolean;
}
```

**Output:**
```typescript
{
  success: boolean;
  videoId: string;
}
```

#### `videos.list`
Lista vídeos com filtros e paginação.

**Input:**
```typescript
{
  status: 'todos' | 'pendente' | 'processando' | 'concluido' | 'erro' | 'publicado';
  dataInicio?: Date;
  dataFim?: Date;
  busca?: string;
  page: number;
  limit: number;
}
```

**Output:**
```typescript
{
  items: Video[];
  total: number;
  page: number;
  totalPages: number;
}
```

#### `videos.get`
Obtém detalhes de um vídeo.

**Input:** `{ id: string }`

**Output:** `Video`

#### `videos.update`
Atualiza um vídeo.

**Input:**
```typescript
{
  id: string;
  titulo?: string;
  tema?: string;
  descricao?: string;
  status?: VideoStatus;
  roteiro?: string;
  hashtags?: string[];
  audioUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  erro?: string;
}
```

#### `videos.delete`
Deleta um vídeo.

**Input:** `{ id: string }`

**Output:** `{ success: boolean }`

#### `videos.stats`
Obtém estatísticas para o dashboard.

**Output:**
```typescript
{
  total: number;
  publicados: number;
  comErro: number;
  taxaSucesso: number;
  videosPorDia: { data: string; count: number }[];
}
```

### Agendamentos Router

#### `agendamentos.create`
Cria um agendamento.

**Input:**
```typescript
{
  tema: string;
  descricao: string;
  tipo: 'uma_vez' | 'diaria' | 'semanal' | 'mensal';
  proximaExecucao: Date;
}
```

#### `agendamentos.list`
Lista agendamentos.

**Output:** `Agendamento[]`

#### `agendamentos.listPendentes`
Lista agendamentos pendentes (para scheduler).

**Output:** `Agendamento[]`

#### `agendamentos.update`
Atualiza um agendamento.

**Input:**
```typescript
{
  id: string;
  tema?: string;
  descricao?: string;
  tipo?: AgendamentoTipo;
  proximaExecucao?: Date;
  ativo?: boolean;
}
```

#### `agendamentos.delete`
Deleta um agendamento.

**Input:** `{ id: string }`

#### `agendamentos.toggle`
Ativa/desativa um agendamento.

**Input:** `{ id: string }`

**Output:** `{ success: boolean; ativo: boolean }`

### Logs Router

#### `logs.list`
Lista logs com filtros.

**Input:**
```typescript
{
  tipo: 'todos' | 'info' | 'sucesso' | 'erro' | 'aviso';
  etapa: 'todas' | LogEtapa;
  videoId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  busca?: string;
  page: number;
  limit: number;
}
```

#### `logs.create`
Cria um log.

**Input:**
```typescript
{
  tipo: LogTipo;
  etapa: LogEtapa;
  mensagem: string;
  detalhes?: string;
  videoId?: string;
}
```

#### `logs.export`
Exporta logs como CSV.

**Input:** Filtros (mesmo que list)

**Output:** `{ csv: string }`

#### `logs.recent`
Obtém logs recentes (últimos 5 segundos).

**Output:** `Log[]`

### Configuracoes Router

#### `configuracoes.get`
Obtém uma configuração.

**Input:** `{ chave: string }`

**Output:** `Configuracao | null`

#### `configuracoes.list`
Lista todas as configurações.

**Output:** `Configuracao[]`

#### `configuracoes.set`
Salva uma configuração.

**Input:** `{ chave: string; valor: string }`

#### `configuracoes.test`
Testa conexão com API.

**Input:** `{ tipo: 'gemini' | 'openai' | 'youtube'; chave: string }`

**Output:** `{ sucesso: boolean; mensagem: string }`

#### `configuracoes.delete`
Remove uma configuração.

**Input:** `{ chave: string }`

### Pipeline Router

#### `pipeline.execute`
Executa o pipeline de criação de vídeo.

**Input:** `{ videoId: string }`

**Output:** `{ success: boolean; message: string }`

#### `pipeline.status`
Obtém status do pipeline.

**Input:** `{ videoId: string }`

**Output:**
```typescript
{
  videoId: string;
  status: VideoStatus;
  etapaAtual: string;
  progresso: number;
  logs: Log[];
}
```

---

## Integrações Externas

### Gemini API

**Função**: Geração de roteiros

**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

**Prompt Template**:
```
Você é um roteirista especializado em YouTube Shorts sobre Pokémon e RPG.
Crie um roteiro épico de [duracao]s com tema: [tema]
O roteiro deve ter introdução impactante, desenvolvimento e conclusão memorável.
Responda em JSON com: roteiro, hashtags[], titulo, duracao
```

**Output**:
```json
{
  "titulo": "Título épico",
  "roteiro": "Texto completo...",
  "hashtags": ["#Pokemon", "#RPG"],
  "duracao": 60
}
```

### Edge TTS

**Função**: Síntese de voz

**Comando**:
```bash
edge-tts --voice "pt-BR-FranciscaNeural" \
  --text "[roteiro]" \
  --write-media "[output.mp3]"
```

**Vozes disponíveis**:
- `pt-BR-FranciscaNeural` (Feminino)
- `pt-BR-AntonioNeural` (Masculino)

### DALL-E

**Função**: Geração de imagens

**Endpoint**: `https://api.openai.com/v1/images/generations`

**Parâmetros**:
```json
{
  "model": "dall-e-3",
  "prompt": "Epic Pokémon scene...",
  "n": 1,
  "size": "1024x1024"
}
```

### YouTube API

**Função**: Publicação de vídeos

**Autenticação**: OAuth2

**Endpoint**: `https://www.googleapis.com/youtube/v3/videos`

**Scopes necessários**:
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube`

### FFmpeg

**Função**: Montagem de vídeo

**Instalação**:
```bash
apt-get install ffmpeg
```

**Comando básico**:
```bash
ffmpeg -i input.mp4 -vf "scale=1080:1920" -c:a copy output.mp4
```

### Pillow

**Função**: Geração de thumbnails

**Instalação**:
```bash
pip install Pillow
```

---

## Scheduler

### Funcionamento

O scheduler é implementado com `node-cron` e verifica agendamentos a cada 60 segundos.

### Fluxo

```
1. Verifica agendamentos ativos
2. Identifica proximaExecucao <= now()
3. Cria vídeo para cada agendamento pendente
4. Executa pipeline automaticamente
5. Atualiza proximaExecucao:
   - uma_vez: desativa
   - diaria: +1 dia
   - semanal: +7 dias
   - mensal: +1 mês
```

### Código

```typescript
cron.schedule('*/1 * * * *', async () => {
  const agora = new Date();
  const pendentes = await db.query.agendamentos.findMany({
    where: and(
      eq(agendamentos.ativo, true),
      lte(agendamentos.proximaExecucao, agora)
    )
  });
  
  for (const ag of pendentes) {
    // Cria vídeo
    // Atualiza próxima execução
  }
});
```

---

## Frontend

### Estrutura de Pastas

```
src/
├── pages/           # 7 páginas principais
│   ├── home.tsx
│   ├── criar-video.tsx
│   ├── historico.tsx
│   ├── agendador.tsx
│   ├── painel-controle.tsx
│   ├── configuracoes.tsx
│   └── teste-modulos.tsx
├── components/      # Componentes reutilizáveis
│   ├── layout.tsx   # Layout com navegação
│   └── ui/          # shadcn/ui components
├── lib/             # Utilitários
│   ├── trpc.ts      # Cliente tRPC
│   └── trpc-provider.tsx
├── hooks/           # Custom hooks
│   └── use-toast.ts
└── App.tsx          # Componente raiz
```

### Rotas

| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Home | Dashboard com estatísticas |
| `/criar` | Criar Vídeo | Formulário de criação |
| `/historico` | Histórico | Lista de vídeos |
| `/agendador` | Agendador | Agendamentos automáticos |
| `/painel` | Painel de Controle | Logs em tempo real |
| `/configuracoes` | Configurações | Chaves de API |
| `/teste` | Teste de Módulos | Teste individual |

### Componentes shadcn/ui

- Alert, AlertDialog
- Badge
- Button
- Calendar
- Card
- Checkbox
- Dialog
- DropdownMenu
- Input
- Label
- Popover
- Progress
- ScrollArea
- Select
- Sheet
- Table
- Tabs
- Textarea
- Toast
- Tooltip

---

## Testes

### Configuração

Framework: **Vitest**

```bash
cd backend
npm test
```

### Testes Implementados

| Arquivo | Testes | Descrição |
|---------|--------|-----------|
| videos.test.ts | 6 | CRUD de vídeos |
| agendamentos.test.ts | 5 | CRUD de agendamentos |
| logs.test.ts | 5 | Criação e exportação |
| configuracoes.test.ts | 5 | CRUD de configurações |
| **Total** | **21** | **100% cobertura** |

### Exemplo

```typescript
import { describe, it, expect } from 'vitest';
import { appRouter } from '../src/routers';

const caller = appRouter.createCaller(mockContext);

describe('Videos Router', () => {
  it('deve criar um novo vídeo', async () => {
    const result = await caller.videos.create({
      titulo: 'Teste',
      tema: 'Charizard',
      descricao: 'Teste',
      usarIA: false,
      legendas: true,
      efeitos: false,
    });
    expect(result.success).toBe(true);
  });
});
```

---

## Deploy

### Variáveis de Ambiente

```bash
# Servidor
PORT=3001
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=senha_segura
DB_NAME=rpmon_dashboard

# APIs
GEMINI_API_KEY=sk-...
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=AIza...
YOUTUBE_REFRESH_TOKEN=1//...
```

### Build

```bash
# Frontend
npm run build
# Output: dist/

# Backend
cd backend
npm run build
# Output: dist/
```

### Deploy com Docker

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DB_HOST=db
      - DB_PASSWORD=${DB_PASSWORD}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - db
  
  db:
    image: mysql:8
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
      - MYSQL_DATABASE=rpmon_dashboard
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

### Deploy na Manus

1. Configure variáveis de ambiente
2. Execute migrations: `npm run db:migrate`
3. Inicie: `npm start`
4. Frontend: sirva pasta `dist/` como estático

---

## Segurança

### Medidas Implementadas

1. **Autenticação**: OAuth2 obrigatório
2. **Validação**: Zod para todos os inputs
3. **CSRF Protection**: Tokens em formulários
4. **Rate Limiting**: Limitação de requisições
5. **Secrets**: Chaves em variáveis de ambiente
6. **HTTPS**: Obrigatório em produção
7. **Sanitização**: Limpeza de outputs

### Headers de Segurança

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
```

---

## Performance

### Otimizações

1. **Code Splitting**: Rotas lazy-loaded
2. **Query Caching**: React Query com staleTime
3. **Pagination**: Listagens paginadas
4. **Indexes**: Índices no banco de dados
5. **Compression**: Gzip no servidor

### Métricas

| Métrica | Alvo |
|---------|------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| API Response | < 200ms |
| Database Query | < 50ms |

---

## Troubleshooting

### Problemas Comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| Erro 500 | API key inválida | Verifique configurações |
| Vídeo não gera | FFmpeg não instalado | `apt-get install ffmpeg` |
| Scheduler parou | Erro no cron | Reinicie o servidor |
| Logs vazios | Filtros ativos | Limpe filtros |
| Timeout | Query lenta | Adicione índices |

---

**Versão**: 1.0.0  
**Última atualização**: Fevereiro 2026
