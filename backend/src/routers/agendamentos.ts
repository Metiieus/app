import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { agendamentos, logs } from '../../database/schema';
import { eq, and, desc, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Schema de validação para criação de agendamento TikTok
const createAgendamentoSchema = z.object({
  nicho: z.string().min(1, 'Nicho é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  tipo: z.enum(['uma_vez', 'diaria', 'semanal', 'mensal']),
  horario: z.string().default('18:00'),
  proximaExecucao: z.date(),
});

export const agendamentosRouter = router({
  // Criar novo agendamento TikTok
  create: protectedProcedure
    .input(createAgendamentoSchema)
    .mutation(async ({ ctx, input }) => {
      const agendamentoId = randomUUID();

      await db.insert(agendamentos).values({
        id: agendamentoId,
        userId: ctx.user!.id,
        nicho: input.nicho,
        descricao: input.descricao,
        tipo: input.tipo,
        horario: input.horario,
        proximaExecucao: input.proximaExecucao,
        ativo: true,
        videosGerados: 0,
      });

      await db.insert(logs).values({
        id: randomUUID(),
        userId: ctx.user!.id,
        tipo: 'info',
        etapa: 'geral',
        mensagem: `Agendamento TikTok criado — nicho: ${input.nicho}, frequência: ${input.tipo}, horário: ${input.horario}`,
      });

      return { success: true, agendamentoId };
    }),

  // Listar agendamentos
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const items = await db.query.agendamentos.findMany({
        where: eq(agendamentos.userId, ctx.user!.id),
        orderBy: desc(agendamentos.criadoEm),
      });
      return items;
    }),

  // Listar agendamentos pendentes (para o scheduler)
  listPendentes: protectedProcedure
    .query(async () => {
      const agora = new Date();
      const items = await db.query.agendamentos.findMany({
        where: and(
          eq(agendamentos.ativo, true),
          lte(agendamentos.proximaExecucao, agora)
        ),
      });
      return items;
    }),

  // Atualizar agendamento
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      nicho: z.string().optional(),
      descricao: z.string().optional(),
      tipo: z.enum(['uma_vez', 'diaria', 'semanal', 'mensal']).optional(),
      horario: z.string().optional(),
      proximaExecucao: z.date().optional(),
      ativo: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      await db.update(agendamentos)
        .set(data)
        .where(and(eq(agendamentos.id, id), eq(agendamentos.userId, ctx.user!.id)));

      return { success: true };
    }),

  // Deletar agendamento
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(agendamentos)
        .where(and(eq(agendamentos.id, input.id), eq(agendamentos.userId, ctx.user!.id)));

      return { success: true };
    }),

  // Pausar/Ativar agendamento
  toggle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const agendamento = await db.query.agendamentos.findFirst({
        where: and(
          eq(agendamentos.id, input.id),
          eq(agendamentos.userId, ctx.user!.id)
        ),
      });

      if (!agendamento) {
        throw new Error('Agendamento não encontrado');
      }

      const novoStatus = !agendamento.ativo;

      await db.update(agendamentos)
        .set({ ativo: novoStatus })
        .where(and(eq(agendamentos.id, input.id), eq(agendamentos.userId, ctx.user!.id)));

      await db.insert(logs).values({
        id: randomUUID(),
        userId: ctx.user!.id,
        tipo: 'info',
        etapa: 'geral',
        mensagem: `Agendamento ${novoStatus ? '▶️ ativado' : '⏸️ pausado'} — nicho: ${agendamento.nicho}`,
      });

      return { success: true, ativo: novoStatus };
    }),
});
