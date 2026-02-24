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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// tRPC middleware
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Scheduler - verifica agendamentos a cada 60 segundos
let schedulerAtivo = true;

cron.schedule('*/1 * * * *', async () => {
  if (!schedulerAtivo) {
    console.log('⏸️ Scheduler pausado');
    return;
  }

  console.log('🔄 Verificando agendamentos...');
  const agora = new Date();

  try {
    // Buscar agendamentos pendentes
    const agendamentosPendentes = await db.query.agendamentos.findMany({
      where: and(
        eq(agendamentos.ativo, true),
        lte(agendamentos.proximaExecucao, agora)
      ),
    });

    console.log(`📋 ${agendamentosPendentes.length} agendamento(s) encontrado(s)`);

    for (const agendamento of agendamentosPendentes) {
      console.log(`🎬 Processando agendamento: ${agendamento.tema}`);

      try {
        // Criar novo vídeo
        const videoId = randomUUID();
        await db.insert(videos).values({
          id: videoId,
          userId: agendamento.userId,
          titulo: agendamento.tema,
          tema: agendamento.tema,
          descricao: agendamento.descricao,
          status: 'pendente',
          hashtags: [],
        });

        // Criar log
        await db.insert(logs).values({
          id: randomUUID(),
          userId: agendamento.userId,
          videoId: videoId,
          tipo: 'info',
          etapa: 'geral',
          mensagem: `Vídeo criado automaticamente pelo agendamento: ${agendamento.tema}`,
        });

        // Atualizar última execução
        let novaProximaExecucao: Date | null = null;
        let ativo = true;

        switch (agendamento.tipo) {
          case 'uma_vez':
            ativo = false;
            novaProximaExecucao = null;
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

        await db.update(agendamentos)
          .set({
            ultimaExecucao: agora,
            proximaExecucao: novaProximaExecucao,
            ativo,
          })
          .where(eq(agendamentos.id, agendamento.id));

        console.log(`✅ Agendamento processado: ${agendamento.tema}`);

      } catch (error) {
        console.error(`❌ Erro ao processar agendamento ${agendamento.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Erro no scheduler:', error);
  }
});

// Rota para controlar o scheduler
app.post('/scheduler/:acao', (req, res) => {
  const { acao } = req.params;

  if (acao === 'start') {
    schedulerAtivo = true;
    res.json({ status: 'ok', message: 'Scheduler ativado' });
  } else if (acao === 'stop') {
    schedulerAtivo = false;
    res.json({ status: 'ok', message: 'Scheduler pausado' });
  } else {
    res.status(400).json({ status: 'error', message: 'Ação inválida' });
  }
});

// Rota para status do scheduler
app.get('/scheduler/status', (req, res) => {
  res.json({ ativo: schedulerAtivo });
});

// Iniciar servidor
async function startServer() {
  // Testar conexão com banco de dados
  const conectado = await testConnection();

  if (!conectado) {
    console.error('❌ Não foi possível conectar ao banco de dados');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 tRPC endpoint: http://localhost:${PORT}/trpc`);
    console.log(`⏰ Scheduler: ${schedulerAtivo ? 'ativo' : 'inativo'}`);
  });
}

startServer().catch(console.error);
