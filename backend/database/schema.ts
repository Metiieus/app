import { mysqlTable, varchar, text, datetime, json, boolean, mysqlEnum, int } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// Tabela de usuários
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`UUID()`),
  openId: varchar('open_id', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: mysqlEnum('role', ['admin', 'user']).notNull().default('user'),
  createdAt: datetime('created_at').notNull().default(sql`NOW()`),
  updatedAt: datetime('updated_at').notNull().default(sql`NOW()`),
});

// Tabela de vídeos TikTok
export const videos = mysqlTable('videos', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`UUID()`),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  nicho: varchar('nicho', { length: 100 }).notNull().default('geral'),
  tema: varchar('tema', { length: 255 }).notNull(),
  descricao: text('descricao').notNull(),
  duracao: varchar('duracao', { length: 10 }).notNull().default('30'),
  estiloNarracao: varchar('estilo_narracao', { length: 50 }).notNull().default('energetico'),
  hookInicial: text('hook_inicial'),
  status: mysqlEnum('status', ['pendente', 'processando', 'concluido', 'erro', 'publicado']).notNull().default('pendente'),
  roteiro: text('roteiro'),
  hashtags: json('hashtags').$type<string[]>().default([]),
  audioUrl: varchar('audio_url', { length: 500 }),
  videoUrl: varchar('video_url', { length: 500 }),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  // Campos TikTok
  tiktokVideoId: varchar('tiktok_video_id', { length: 100 }),
  tiktokUrl: varchar('tiktok_url', { length: 500 }),
  tiktokViews: int('tiktok_views').default(0),
  tiktokLikes: int('tiktok_likes').default(0),
  tiktokShares: int('tiktok_shares').default(0),
  tiktokComments: int('tiktok_comments').default(0),
  // Opções de produção
  usarIA: boolean('usar_ia').notNull().default(true),
  legendasAnimadas: boolean('legendas_animadas').notNull().default(true),
  musicaTrending: boolean('musica_trending').notNull().default(true),
  efeitos: boolean('efeitos').notNull().default(true),
  autoPublicar: boolean('auto_publicar').notNull().default(false),
  erro: text('erro'),
  criadoEm: datetime('criado_em').notNull().default(sql`NOW()`),
  publicadoEm: datetime('publicado_em'),
});

// Tabela de agendamentos
export const agendamentos = mysqlTable('agendamentos', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`UUID()`),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  nicho: varchar('nicho', { length: 100 }).notNull(),
  descricao: text('descricao').notNull(),
  tipo: mysqlEnum('tipo', ['uma_vez', 'diaria', 'semanal', 'mensal']).notNull(),
  horario: varchar('horario', { length: 5 }).notNull().default('18:00'),
  proximaExecucao: datetime('proxima_execucao').notNull(),
  ultimaExecucao: datetime('ultima_execucao'),
  ativo: boolean('ativo').notNull().default(true),
  videosGerados: int('videos_gerados').notNull().default(0),
  criadoEm: datetime('criado_em').notNull().default(sql`NOW()`),
});

// Tabela de logs
export const logs = mysqlTable('logs', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`UUID()`),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  videoId: varchar('video_id', { length: 36 }).references(() => videos.id),
  tipo: mysqlEnum('tipo', ['info', 'sucesso', 'erro', 'aviso']).notNull(),
  etapa: mysqlEnum('etapa', ['roteiro', 'narracao', 'imagem', 'video', 'thumbnail', 'publicacao', 'geral']).notNull(),
  mensagem: text('mensagem').notNull(),
  detalhes: text('detalhes'),
  criadoEm: datetime('criado_em').notNull().default(sql`NOW()`),
});

// Tabela de imagens geradas por IA
export const imagensIA = mysqlTable('imagens_ia', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`UUID()`),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  videoId: varchar('video_id', { length: 36 }).references(() => videos.id),
  prompt: text('prompt').notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  modelo: varchar('modelo', { length: 100 }).notNull(),
  formato: varchar('formato', { length: 20 }).notNull().default('1080x1920'),
  criadoEm: datetime('criado_em').notNull().default(sql`NOW()`),
});

// Tabela de configurações
export const configuracoes = mysqlTable('configuracoes', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`UUID()`),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  chave: varchar('chave', { length: 100 }).notNull(),
  valor: text('valor').notNull(),
  criadoEm: datetime('criado_em').notNull().default(sql`NOW()`),
});

// Tipos inferidos
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
export type Agendamento = typeof agendamentos.$inferSelect;
export type NewAgendamento = typeof agendamentos.$inferInsert;
export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;
export type ImagemIA = typeof imagensIA.$inferSelect;
export type NewImagemIA = typeof imagensIA.$inferInsert;
export type Configuracao = typeof configuracoes.$inferSelect;
export type NewConfiguracao = typeof configuracoes.$inferInsert;
