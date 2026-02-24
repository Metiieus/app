import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cron from 'node-cron';
import { appRouter } from './routers';
import { createContext } from './trpc';
import { testConnection, db } from './db';
import { agendamentos, videos, logs } from '../database/schema';
import { eq, and, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TikFactory API',
    timestamp: new Date().toISOString(),
    scheduler: schedulerAtivo ? 'running' : 'paused',
  });
});

// tRPC middleware
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// ============================================================
// SCHEDULER — Máquina de Vídeos TikTok Automática
// Verifica agendamentos a cada 60 segundos
// ============================================================
let schedulerAtivo = true;

cron.schedule('*/1 * * * *', async () => {
  if (!schedulerAtivo) {
    console.log('⏸️  Máquina de vídeos pausada');
    return;
  }

  const agora = new Date();
  console.log(`🤖 [TikFactory] Verificando agendamentos... ${agora.toLocaleTimeString('pt-BR')}`);

  try {
    const agendamentosPendentes = await db.query.agendamentos.findMany({
      where: and(
        eq(agendamentos.ativo, true),
        lte(agendamentos.proximaExecucao, agora)
      ),
    });

    if (agendamentosPendentes.length > 0) {
      console.log(`📋 ${agendamentosPendentes.length} agendamento(s) para processar`);
    }

    for (const agendamento of agendamentosPendentes) {
      console.log(`🎬 Iniciando geração automática — nicho: ${agendamento.nicho}`);

      try {
        // Criar novo vídeo TikTok automaticamente
        const videoId = randomUUID();
        await db.insert(videos).values({
          id: videoId,
          userId: agendamento.userId,
          titulo: `${agendamento.nicho} — ${new Date().toLocaleDateString('pt-BR')}`,
          nicho: agendamento.nicho,
          tema: agendamento.nicho,
          descricao: agendamento.descricao,
          duracao: '30',
          estiloNarracao: 'energetico',
          status: 'pendente',
          hashtags: [],
          usarIA: true,
          legendasAnimadas: true,
          musicaTrending: true,
          efeitos: true,
          autoPublicar: true,
        });

        // Log de criação automática
        await db.insert(logs).values({
          id: randomUUID(),
          userId: agendamento.userId,
          videoId,
          tipo: 'info',
          etapa: 'geral',
          mensagem: `🤖 Vídeo TikTok criado automaticamente pelo agendador`,
          detalhes: `Nicho: ${agendamento.nicho} | Frequência: ${agendamento.tipo} | Horário: ${agendamento.horario}`,
        });

        // Atualizar contador e próxima execução
        let novaProximaExecucao: Date | null = null;
        let ativo = true;

        switch (agendamento.tipo) {
          case 'uma_vez':
            ativo = false;
            novaProximaExecucao = new Date(agora); // Manter data para referência
            break;
          case 'diaria':
            novaProximaExecucao = new Date(agora);
            novaProximaExecucao.setDate(novaProximaExecucao.getDate() + 1);
            break;
          case 'semanal':
            novaProximaExecucao = new Date(agora);
            novaProximaExecucao.setDate(novaProximaExecucao.getDate() + 7);
            break;
          case 'mensal':
            novaProximaExecucao = new Date(agora);
            novaProximaExecucao.setMonth(novaProximaExecucao.getMonth() + 1);
            break;
        }

        // Ajustar horário da próxima execução
        if (novaProximaExecucao && agendamento.horario) {
          const [hora, minuto] = agendamento.horario.split(':').map(Number);
          novaProximaExecucao.setHours(hora, minuto, 0, 0);
        }

        await db.update(agendamentos)
          .set({
            ultimaExecucao: agora,
            proximaExecucao: novaProximaExecucao || agora,
            ativo,
            videosGerados: (agendamento.videosGerados || 0) + 1,
          })
          .where(eq(agendamentos.id, agendamento.id));

        console.log(`✅ Agendamento processado — nicho: ${agendamento.nicho}, vídeo: ${videoId}`);

        // TODO: Disparar pipeline automaticamente
        // await executePipeline(videoId, agendamento.userId);

      } catch (error) {
        console.error(`❌ Erro ao processar agendamento ${agendamento.id}:`, error);

        await db.insert(logs).values({
          id: randomUUID(),
          userId: agendamento.userId,
          tipo: 'erro',
          etapa: 'geral',
          mensagem: `Erro no agendamento automático — nicho: ${agendamento.nicho}`,
          detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro no scheduler TikFactory:', error);
  }
});

// ============================================================
// ROTAS DE CONTROLE DO SCHEDULER
// ============================================================
app.post('/scheduler/:acao', (req, res) => {
  const { acao } = req.params;

  if (acao === 'start') {
    schedulerAtivo = true;
    console.log('▶️  Máquina de vídeos ativada');
    res.json({ status: 'ok', message: 'Máquina de vídeos TikTok ativada' });
  } else if (acao === 'stop') {
    schedulerAtivo = false;
    console.log('⏸️  Máquina de vídeos pausada');
    res.json({ status: 'ok', message: 'Máquina de vídeos TikTok pausada' });
  } else {
    res.status(400).json({ status: 'error', message: 'Ação inválida. Use "start" ou "stop".' });
  }
});

app.get('/scheduler/status', (req, res) => {
  res.json({
    ativo: schedulerAtivo,
    service: 'TikFactory Scheduler',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
async function startServer() {
  const conectado = await testConnection();

  if (!conectado) {
    console.error('❌ Não foi possível conectar ao banco de dados');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ================================');
    console.log('   TikFactory — Máquina de Vídeos');
    console.log('================================');
    console.log(`📡 API:       http://localhost:${PORT}`);
    console.log(`🔌 tRPC:      http://localhost:${PORT}/trpc`);
    console.log(`⚙️  Scheduler: ${schedulerAtivo ? '▶️  Ativo' : '⏸️  Pausado'}`);
    console.log('================================');
    console.log('');
  });
}

startServer().catch(console.error);
