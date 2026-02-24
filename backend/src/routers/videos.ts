import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { videos, logs } from '../../database/schema';
import { eq, and, desc, like } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Schema de validação para criação de vídeo
const createVideoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  tema: z.string().min(1, 'Tema é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  usarIA: z.boolean().default(false),
  legendas: z.boolean().default(false),
  efeitos: z.boolean().default(false),
});

// Schema para filtros de listagem
const listVideosSchema = z.object({
  status: z.enum(['todos', 'pendente', 'processando', 'concluido', 'erro', 'publicado']).default('todos'),
  dataInicio: z.date().optional(),
  dataFim: z.date().optional(),
  busca: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
});

export const videosRouter = router({
  // Criar novo vídeo
  create: protectedProcedure
    .input(createVideoSchema)
    .mutation(async ({ ctx, input }) => {
      const videoId = randomUUID();
      
      await db.insert(videos).values({
        id: videoId,
        userId: ctx.user!.id,
        titulo: input.titulo,
        tema: input.tema,
        descricao: input.descricao,
        status: 'pendente',
        hashtags: [],
      });

      // Criar log
      await db.insert(logs).values({
        id: randomUUID(),
        userId: ctx.user!.id,
        videoId: videoId,
        tipo: 'info',
        etapa: 'geral',
        mensagem: `Vídeo "${input.titulo}" criado com sucesso`,
      });

      return { success: true, videoId };
    }),

  // Listar vídeos com filtros
  list: protectedProcedure
    .input(listVideosSchema)
    .query(async ({ ctx, input }) => {
      const { status, dataInicio, dataFim, busca, page, limit } = input;
      const offset = (page - 1) * limit;

      let conditions = eq(videos.userId, ctx.user!.id);

      if (status !== 'todos') {
        conditions = and(conditions, eq(videos.status, status))!;
      }

      if (dataInicio) {
        conditions = and(conditions, desc(videos.criadoEm))!;
      }

      if (busca) {
        conditions = and(
          conditions,
          like(videos.titulo, `%${busca}%`)
        )!;
      }

      const [items, total] = await Promise.all([
        db.query.videos.findMany({
          where: conditions,
          orderBy: desc(videos.criadoEm),
          limit,
          offset,
        }),
        db.select({ count: db.fn.count() }).from(videos).where(conditions),
      ]);

      return {
        items,
        total: total[0].count,
        page,
        totalPages: Math.ceil(total[0].count / limit),
      };
    }),

  // Obter detalhes de um vídeo
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const video = await db.query.videos.findFirst({
        where: and(
          eq(videos.id, input.id),
          eq(videos.userId, ctx.user!.id)
        ),
      });

      if (!video) {
        throw new Error('Vídeo não encontrado');
      }

      return video;
    }),

  // Atualizar vídeo
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      titulo: z.string().optional(),
      tema: z.string().optional(),
      descricao: z.string().optional(),
      status: z.enum(['pendente', 'processando', 'concluido', 'erro', 'publicado']).optional(),
      roteiro: z.string().optional(),
      hashtags: z.array(z.string()).optional(),
      audioUrl: z.string().optional(),
      videoUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      youtubeVideoId: z.string().optional(),
      youtubeUrl: z.string().optional(),
      erro: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      await db.update(videos)
        .set(data)
        .where(and(eq(videos.id, id), eq(videos.userId, ctx.user!.id)));

      // Criar log
      await db.insert(logs).values({
        id: randomUUID(),
        userId: ctx.user!.id,
        videoId: id,
        tipo: 'info',
        etapa: 'geral',
        mensagem: `Vídeo atualizado`,
        detalhes: JSON.stringify(data),
      });

      return { success: true };
    }),

  // Deletar vídeo
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, ctx.user!.id)));

      // Criar log
      await db.insert(logs).values({
        id: randomUUID(),
        userId: ctx.user!.id,
        videoId: input.id,
        tipo: 'info',
        etapa: 'geral',
        mensagem: `Vídeo deletado`,
      });

      return { success: true };
    }),

  // Obter estatísticas para dashboard
  stats: protectedProcedure
    .query(async ({ ctx }) => {
      const userVideos = await db.query.videos.findMany({
        where: eq(videos.userId, ctx.user!.id),
      });

      const total = userVideos.length;
      const publicados = userVideos.filter(v => v.status === 'publicado').length;
      const comErro = userVideos.filter(v => v.status === 'erro').length;
      const taxaSucesso = total > 0 ? Math.round((publicados / total) * 100) : 0;

      // Vídeos por dia (últimos 7 dias)
      const hoje = new Date();
      const videosPorDia = [];
      for (let i = 6; i >= 0; i--) {
        const data = new Date(hoje);
        data.setDate(data.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];
        
        const count = userVideos.filter(v => {
          const videoData = v.criadoEm.toISOString().split('T')[0];
          return videoData === dataStr;
        }).length;
        
        videosPorDia.push({ data: dataStr, count });
      }

      return {
        total,
        publicados,
        comErro,
        taxaSucesso,
        videosPorDia,
      };
    }),
});
