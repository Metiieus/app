import { router } from '../trpc';
import { videosRouter } from './videos';
import { agendamentosRouter } from './agendamentos';
import { logsRouter } from './logs';
import { configuracoesRouter } from './configuracoes';
import { pipelineRouter } from './pipeline';

export const appRouter = router({
  videos: videosRouter,
  agendamentos: agendamentosRouter,
  logs: logsRouter,
  configuracoes: configuracoesRouter,
  pipeline: pipelineRouter,
});

// Exportar tipo do router
export type AppRouter = typeof appRouter;
