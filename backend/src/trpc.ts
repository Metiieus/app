import { initTRPC } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { z } from 'zod';

// Contexto do tRPC
export function createContext({ req, res }: CreateExpressContextOptions) {
  return {
    req,
    res,
    user: req.headers.authorization ? { id: 'mock-user-id', name: 'Mock User' } : null,
  };
}

type Context = Awaited<ReturnType<typeof createContext>>;

// Inicializar tRPC
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Exportar helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Procedure protegida (requer autenticação)
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Não autorizado');
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
