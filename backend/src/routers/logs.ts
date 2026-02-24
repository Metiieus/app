import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { logs } from '../../database/schema';
import { eq, and, desc, like, gte, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Schema para filtros de listagem
const listLogsSchema = z.object({
  tipo: z.enum(['todos', 'info', 'sucesso', 'erro', 'aviso']).default('todos'),
  etapa: z.enum(['todas', 'roteiro', 'narracao', 'imagem', 'video', 'thumbnail', 'publicacao', 'geral']).default('todas'),
  videoId: z.string().optional(),
  dataInicio: z.date().optional(),
  dataFim: z.date().optional(),
  busca: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(50),
});

export const logsRouter = router({
  // Listar logs com filtros
  list: protectedProcedure
    .input(listLogsSchema)
    .query(async ({ ctx, input }) => {
      const { tipo, etapa, videoId, dataInicio, dataFim, busca, page, limit } = input;
      const offset = (page - 1) * limit;

      let conditions = eq(logs.userId, ctx.user!.id);

      if (tipo !== 'todos') {
        conditions = and(conditions, eq(logs.tipo, tipo))!;
      }

      if (etapa !== 'todas') {
        conditions = and(conditions, eq(logs.etapa, etapa))!;
      }

      if (videoId) {
        conditions = and(conditions, eq(logs.videoId, videoId))!;
      }

      if (dataInicio) {
        conditions = and(conditions, gte(logs.criadoEm, dataInicio))!;
      }

      if (dataFim) {
        conditions = and(conditions, lte(logs.criadoEm, dataFim))!;
      }

      if (busca) {
        conditions = and(
          conditions,
          like(logs.mensagem, `%${busca}%`)
        )!;
      }

      const [items, total] = await Promise.all([
        db.query.logs.findMany({
          where: conditions,
          orderBy: desc(logs.criadoEm),
          limit,
          offset,
        }),
        db.select({ count: db.fn.count() }).from(logs).where(conditions),
      ]);

      return {
        items,
        total: total[0].count,
        page,
        totalPages: Math.ceil(total[0].count / limit),
      };
    }),

  // Criar log (usado internamente)
  create: protectedProcedure
    .input(z.object({
      tipo: z.enum(['info', 'sucesso', 'erro', 'aviso']),
      etapa: z.enum(['roteiro', 'narracao', 'imagem', 'video', 'thumbnail', 'publicacao', 'geral']),
      mensagem: z.string(),
      detalhes: z.string().optional(),
      videoId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const logId = randomUUID();
      
      await db.insert(logs).values({
        id: logId,
        userId: ctx.user!.id,
        videoId: input.videoId || null,
        tipo: input.tipo,
        etapa: input.etapa,
        mensagem: input.mensagem,
        detalhes: input.detalhes || null,
      });

      return { success: true, logId };
    }),

  // Exportar logs como CSV
  export: protectedProcedure
    .input(z.object({
      tipo: z.enum(['todos', 'info', 'sucesso', 'erro', 'aviso']).default('todos'),
      etapa: z.enum(['todas', 'roteiro', 'narracao', 'imagem', 'video', 'thumbnail', 'publicacao', 'geral']).default('todas'),
      dataInicio: z.date().optional(),
      dataFim: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { tipo, etapa, dataInicio, dataFim } = input;

      let conditions = eq(logs.userId, ctx.user!.id);

      if (tipo !== 'todos') {
        conditions = and(conditions, eq(logs.tipo, tipo))!;
      }

      if (etapa !== 'todas') {
        conditions = and(conditions, eq(logs.etapa, etapa))!;
      }

      if (dataInicio) {
        conditions = and(conditions, gte(logs.criadoEm, dataInicio))!;
      }

      if (dataFim) {
        conditions = and(conditions, lte(logs.criadoEm, dataFim))!;
      }

      const items = await db.query.logs.findMany({
        where: conditions,
        orderBy: desc(logs.criadoEm),
      });

      // Gerar CSV
      const headers = ['Data', 'Tipo', 'Etapa', 'Mensagem', 'Detalhes'];
      const rows = items.map(log => [
        log.criadoEm.toISOString(),
        log.tipo,
        log.etapa,
        log.mensagem,
        log.detalhes || '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return { csv };
    }),

  // Obter logs em tempo real (últimos 5 segundos)
  recent: protectedProcedure
    .query(async ({ ctx }) => {
      const cincoSegundosAtras = new Date(Date.now() - 5000);
      
      const items = await db.query.logs.findMany({
        where: and(
          eq(logs.userId, ctx.user!.id),
          gte(logs.criadoEm, cincoSegundosAtras)
        ),
        orderBy: desc(logs.criadoEm),
        limit: 20,
      });

      return items;
    }),
});
