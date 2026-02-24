// Cliente de API real — faz chamadas HTTP ao backend em localhost:3001
const API_BASE = 'http://localhost:3001/api';

// ID de usuário fixo para desenvolvimento (sem autenticação)
const DEV_USER_ID = 'dev-user-001';

async function apiCall(endpoint: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': DEV_USER_ID,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Erro ${res.status}`);
  }

  return res.json();
}

// API de vídeos
export const videosApi = {
  criar: (data: {
    titulo: string;
    nicho: string;
    tema: string;
    duracao: string;
    estiloNarracao: string;
    hookInicial?: string;
    legendasAnimadas: boolean;
    musicaTrending: boolean;
    efeitos: boolean;
    autoPublicar: boolean;
  }) => apiCall('/videos', 'POST', data),

  listar: (params?: { status?: string; busca?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return apiCall(`/videos${q ? '?' + q : ''}`);
  },

  deletar: (id: string) => apiCall(`/videos/${id}`, 'DELETE'),

  stats: () => apiCall('/videos/stats'),
};

// API do pipeline
export const pipelineApi = {
  executar: (videoId: string) => apiCall(`/pipeline/${videoId}`, 'POST'),
  status: (videoId: string) => apiCall(`/pipeline/${videoId}/status`),
};

// API de logs
export const logsApi = {
  listar: (params?: { videoId?: string; tipo?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return apiCall(`/logs${q ? '?' + q : ''}`);
  },
};

// API de agendamentos
export const agendamentosApi = {
  criar: (data: unknown) => apiCall('/agendamentos', 'POST', data),
  listar: () => apiCall('/agendamentos'),
  atualizar: (id: string, data: unknown) => apiCall(`/agendamentos/${id}`, 'PUT', data),
  deletar: (id: string) => apiCall(`/agendamentos/${id}`, 'DELETE'),
};

// Tipos
export type AppRouter = unknown;
export const trpc = { createClient: () => ({}), Provider: ({ children }: { children: React.ReactNode }) => children };
