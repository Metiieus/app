import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { agendamentos, logs } from '../../database/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Schema de validação para criação de agendamento
const createAgendamentoSchema = z.object({
  tema: z.string().min(1, 'Tema é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  tipo: z.enum(['uma_vez', 'diaria', 'semanal', 'mensal']),
  proximaExecucao: z.date(),
});

export const agendamentosRouter = router({
  // Criar novo agendamento
  create: protectedProcedure
    .input(createAgendamentoSchema)
    .mutation(async ({ ctx, input }) => {
      const agendamentoId = randomUUID();
      
      await db.insert(agendamentos).values({
        id: agendamentoId,
        userId: ctx.user!.id,
        tema: input.tema,
        descricao: input.descricao,
        tipo: input.tipo,
        proximaExecucao: input.proximaExecucao,
        ativo: true,
      });

      // Criar log
      await db.insert(logs).values({
        id: randomUUID(),
        userId: ctx.user!.id,
        tipo: 'info',
        etapa: 'geral',
        mensagem: `Agendamento "${input.tema}" criado com sucesso`,
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
    .query(async ({ ctx }) => {
      const agora = new Date();
      
      const items = await db.query.agendamentos.findMany({
        where: and(
          eq(agendamentos.userId, ctx.user!.id),
          eq(agendamentos.ativo, true),
          gte(agendamentos.proximaExecucao, agora)
        ),
        orderBy: desc(agendamentos.proximaExecucao),
      });

      return items;
    }),

  // Atualizar agendamento
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      tema: z.string().optional(),
      descricao: z.string().optional(),
      tipo: z.enum(['uma_vez', 'diaria', 'semanal', 'mensal']).optional(),
      proximaExecucao: z.date().optional(),
      ativo: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      await db.update(agendamentos)
        .set(data)
        .where(and(eq(agendamentos.id, id), eq(agendamentos.userId, ctx.user!.id)));

      // Criar log
      await db.insert(logs).values({
        id: randomUUID(),
        userId: ctx.user!.id,
        tipo: 'info',
        etapa: 'geral',
        mensagem: `Agendamento atualizado`,
        detalhes: JSON.stringify(data),
      });

      return { success: true };
    }),

  // Deletar agendamento
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(agendamentos)
        .where(and(eq(agendamentos.id, input.id), eq(agendamentos.userId, ctx.user!.id)));

      // Criar log
      await db.insert(logs).values({
        id: randomUUID(),
        userId: ctx.user!.id,
        tipo: 'info',
        etapa: 'geral',
        mensagem: `Agendamento deletado`,
      });

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

      // Criar log
      await db.insert(logs).values({
        id: randomUUID(),
        userId: ctx.user!.id,
        tipo: 'info',
        etapa: 'geral',
        mensagem: `Agendamento ${novoStatus ? 'ativado' : 'pausado'}`,
      });

      return { success: true, ativo: novoStatus };
    }),
});
