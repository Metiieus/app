import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { videos, logs } from '../../database/schema';
import { eq, and, desc, like } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Schema de validação para criação de vídeo TikTok
const createVideoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  nicho: z.string().min(1, 'Nicho é obrigatório'),
  tema: z.string().min(1, 'Tema é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  duracao: z.string().default('30'),
  estiloNarracao: z.string().default('energetico'),
  hookInicial: z.string().optional(),
  usarIA: z.boolean().default(true),
  legendasAnimadas: z.boolean().default(true),
  musicaTrending: z.boolean().default(true),
  efeitos: z.boolean().default(true),
  autoPublicar: z.boolean().default(false),
});

// Schema para filtros de listagem
const listVideosSchema = z.object({
  status: z.enum(['todos', 'pendente', 'processando', 'concluido', 'erro', 'publicado']).default('todos'),
  nicho: z.string().optional(),
  busca: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

export const videosRouter = router({
  // Criar novo vídeo TikTok
  create: protectedProcedure
    .input(createVideoSchema)
    .mutation(async ({ ctx, input }) => {
      const videoId = randomUUID();

      await db.insert(videos).values({
        id: videoId,
        userId: ctx.user!.id,
        titulo: input.titulo,
        nicho: input.nicho,
        tema: input.tema,
        descricao: input.descricao,
        duracao: input.duracao,
        estiloNarracao: input.estiloNarracao,
        hookInicial: input.hookInicial,
        status: 'pendente',
        hashtags: [],
        usarIA: input.usarIA,
        legendasAnimadas: input.legendasAnimadas,
        musicaTrending: input.musicaTrending,
        efeitos: input.efeitos,
        autoPublicar: input.autoPublicar,
      });

      await db.insert(logs).values({
        id: randomUUID(),
        userId: ctx.user!.id,
        videoId,
        tipo: 'info',
        etapa: 'geral',
        mensagem: `Vídeo TikTok "${input.titulo}" criado — nicho: ${input.nicho}`,
      });

      return { success: true, videoId };
    }),

  // Listar vídeos com filtros
  list: protectedProcedure
    .input(listVideosSchema)
    .query(async ({ ctx, input }) => {
      const { status, nicho, busca, page, limit } = input;
      const offset = (page - 1) * limit;

      let conditions = eq(videos.userId, ctx.user!.id);

      if (status !== 'todos') {
        conditions = and(conditions, eq(videos.status, status))!;
      }

      if (nicho) {
        conditions = and(conditions, eq(videos.nicho, nicho))!;
      }

      if (busca) {
        conditions = and(conditions, like(videos.titulo, `%${busca}%`))!;
      }

      const items = await db.query.videos.findMany({
        where: conditions,
        orderBy: desc(videos.criadoEm),
        limit,
        offset,
      });

      return {
        items,
        page,
        hasMore: items.length === limit,
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
      nicho: z.string().optional(),
      tema: z.string().optional(),
      descricao: z.string().optional(),
      status: z.enum(['pendente', 'processando', 'concluido', 'erro', 'publicado']).optional(),
      roteiro: z.string().optional(),
      hashtags: z.array(z.string()).optional(),
      audioUrl: z.string().optional(),
      videoUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      tiktokVideoId: z.string().optional(),
      tiktokUrl: z.string().optional(),
      tiktokViews: z.number().optional(),
      tiktokLikes: z.number().optional(),
      erro: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      await db.update(videos)
        .set(data)
        .where(and(eq(videos.id, id), eq(videos.userId, ctx.user!.id)));

      return { success: true };
    }),

  // Deletar vídeo
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, ctx.user!.id)));

      return { success: true };
    }),

  // Estatísticas do dashboard TikTok
  stats: protectedProcedure
    .query(async ({ ctx }) => {
      const userVideos = await db.query.videos.findMany({
        where: eq(videos.userId, ctx.user!.id),
      });

      const total = userVideos.length;
      const publicados = userVideos.filter(v => v.status === 'publicado').length;
      const comErro = userVideos.filter(v => v.status === 'erro').length;
      const taxaSucesso = total > 0 ? Math.round(((total - comErro) / total) * 100) : 0;
      const totalViews = userVideos.reduce((acc, v) => acc + (v.tiktokViews || 0), 0);
      const totalLikes = userVideos.reduce((acc, v) => acc + (v.tiktokLikes || 0), 0);

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

        videosPorDia.push({
          data: dataStr,
          count,
          views: userVideos
            .filter(v => v.criadoEm.toISOString().split('T')[0] === dataStr)
            .reduce((acc, v) => acc + (v.tiktokViews || 0), 0),
        });
      }

      // Top nichos
      const nichoCount: Record<string, { videos: number; views: number }> = {};
      userVideos.forEach(v => {
        if (!nichoCount[v.nicho]) nichoCount[v.nicho] = { videos: 0, views: 0 };
        nichoCount[v.nicho].videos++;
        nichoCount[v.nicho].views += v.tiktokViews || 0;
      });

      const topNichos = Object.entries(nichoCount)
        .sort((a, b) => b[1].views - a[1].views)
        .slice(0, 5)
        .map(([nome, data]) => ({ nome, ...data }));

      return {
        total,
        publicados,
        comErro,
        taxaSucesso,
        totalViews,
        totalLikes,
        videosPorDia,
        topNichos,
      };
    }),
});
