import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { configuracoes, logs } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Schema para testar conexão com API
const testApiSchema = z.object({
  tipo: z.enum(['gemini', 'openai', 'youtube']),
  chave: z.string(),
});

// Schema para salvar configuração
const setConfigSchema = z.object({
  chave: z.string(),
  valor: z.string(),
});

export const configuracoesRouter = router({
  // Obter configuração
  get: protectedProcedure
    .input(z.object({ chave: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await db.query.configuracoes.findFirst({
        where: and(
          eq(configuracoes.userId, ctx.user!.id),
          eq(configuracoes.chave, input.chave)
        ),
      });

      if (!config) {
        return null;
      }

      // Mascarar valor (mostrar apenas últimos 4 caracteres)
      const valorMascarado = config.valor.length > 4
        ? '*'.repeat(config.valor.length - 4) + config.valor.slice(-4)
        : '*'.repeat(config.valor.length);

      return {
        ...config,
        valorMascarado,
      };
    }),

  // Obter todas as configurações do usuário
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const items = await db.query.configuracoes.findMany({
        where: eq(configuracoes.userId, ctx.user!.id),
      });

      // Mascarar valores sensíveis
      return items.map(config => ({
        ...config,
        valorMascarado: config.valor.length > 4
          ? '*'.repeat(config.valor.length - 4) + config.valor.slice(-4)
          : '*'.repeat(config.valor.length),
      }));
    }),

  // Salvar configuração
  set: protectedProcedure
    .input(setConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.configuracoes.findFirst({
        where: and(
          eq(configuracoes.userId, ctx.user!.id),
          eq(configuracoes.chave, input.chave)
        ),
      });

      if (existing) {
        await db.update(configuracoes)
          .set({ valor: input.valor })
          .where(and(
            eq(configuracoes.userId, ctx.user!.id),
            eq(configuracoes.chave, input.chave)
          ));
      } else {
        await db.insert(configuracoes).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          chave: input.chave,
          valor: input.valor,
        });
      }

      // Criar log
      await db.insert(logs).values({
        id: randomUUID(),
        userId: ctx.user!.id,
        tipo: 'info',
        etapa: 'geral',
        mensagem: `Configuração "${input.chave}" atualizada`,
      });

      return { success: true };
    }),

  // Testar conexão com API
  test: protectedProcedure
    .input(testApiSchema)
    .mutation(async ({ ctx, input }) => {
      const { tipo, chave } = input;

      try {
        let sucesso = false;
        let mensagem = '';

        switch (tipo) {
          case 'gemini':
            // Testar conexão com Gemini API
            const geminiResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${chave}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: 'Olá' }] }],
                }),
              }
            );
            sucesso = geminiResponse.ok;
            mensagem = sucesso ? 'Conexão com Gemini API estabelecida' : 'Falha na conexão com Gemini API';
            break;

          case 'openai':
            // Testar conexão com OpenAI API
            const openaiResponse = await fetch('https://api.openai.com/v1/models', {
              headers: {
                'Authorization': `Bearer ${chave}`,
              },
            });
            sucesso = openaiResponse.ok;
            mensagem = sucesso ? 'Conexão com OpenAI API estabelecida' : 'Falha na conexão com OpenAI API';
            break;

          case 'youtube':
            // Testar conexão com YouTube API
            const youtubeResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&key=${chave}`,
              {
                headers: {
                  'Authorization': `Bearer ${chave}`,
                },
              }
            );
            sucesso = youtubeResponse.ok;
            mensagem = sucesso ? 'Conexão com YouTube API estabelecida' : 'Falha na conexão com YouTube API';
            break;

          default:
            mensagem = 'Tipo de API não suportado';
        }

        // Criar log
        await db.insert(logs).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          tipo: sucesso ? 'sucesso' : 'erro',
          etapa: 'geral',
          mensagem: `Teste de conexão ${tipo}: ${mensagem}`,
        });

        return { sucesso, mensagem };
      } catch (error) {
        const mensagem = `Erro ao testar conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        
        // Criar log
        await db.insert(logs).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          tipo: 'erro',
          etapa: 'geral',
          mensagem,
        });

        return { sucesso: false, mensagem };
      }
    }),

  // Deletar configuração
  delete: protectedProcedure
    .input(z.object({ chave: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(configuracoes)
        .where(and(
          eq(configuracoes.userId, ctx.user!.id),
          eq(configuracoes.chave, input.chave)
        ));

      // Criar log
      await db.insert(logs).values({
        id: randomUUID(),
        userId: ctx.user!.id,
        tipo: 'info',
        etapa: 'geral',
        mensagem: `Configuração "${input.chave}" removida`,
      });

      return { success: true };
    }),
});
