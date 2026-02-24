// Tipos compartilhados entre frontend e backend

export type UserRole = 'admin' | 'user';

export type VideoStatus = 'pendente' | 'processando' | 'concluido' | 'erro' | 'publicado';

export type AgendamentoTipo = 'uma_vez' | 'diaria' | 'semanal' | 'mensal';

export type LogTipo = 'info' | 'sucesso' | 'erro' | 'aviso';

export type LogEtapa = 'roteiro' | 'narracao' | 'imagem' | 'video' | 'thumbnail' | 'publicacao' | 'geral';

export interface User {
  id: string;
  openId: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Video {
  id: string;
  userId: string;
  titulo: string;
  tema: string;
  descricao: string;
  status: VideoStatus;
  roteiro: string | null;
  hashtags: string[];
  audioUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  youtubeVideoId: string | null;
  youtubeUrl: string | null;
  erro: string | null;
  criadoEm: Date;
  publicadoEm: Date | null;
}

export interface Agendamento {
  id: string;
  userId: string;
  tema: string;
  descricao: string;
  tipo: AgendamentoTipo;
  proximaExecucao: Date;
  ultimaExecucao: Date | null;
  ativo: boolean;
  criadoEm: Date;
}

export interface Log {
  id: string;
  userId: string;
  videoId: string | null;
  tipo: LogTipo;
  etapa: LogEtapa;
  mensagem: string;
  detalhes: string | null;
  criadoEm: Date;
}

export interface ImagemIA {
  id: string;
  userId: string;
  videoId: string | null;
  prompt: string;
  url: string;
  modelo: string;
  criadoEm: Date;
}

export interface Configuracao {
  id: string;
  userId: string;
  chave: string;
  valor: string;
  criadoEm: Date;
}

// Tipos para API
export interface CreateVideoInput {
  titulo: string;
  tema: string;
  descricao: string;
  usarIA: boolean;
  legendas: boolean;
  efeitos: boolean;
}

export interface CreateAgendamentoInput {
  tema: string;
  descricao: string;
  tipo: AgendamentoTipo;
  proximaExecucao: Date;
}

export interface UpdateConfiguracaoInput {
  chave: string;
  valor: string;
}

export interface PipelineStatus {
  videoId: string;
  etapaAtual: LogEtapa;
  progresso: number;
  status: VideoStatus;
}
