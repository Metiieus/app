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
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// SERVIR ARQUIVOS DE MÍDIA GERADOS
// Os vídeos, áudios e imagens ficam em %TEMP%/tikfactory/
// ============================================================
const WORK_DIR = path.join(os.tmpdir(), 'tikfactory');
const VIDEO_DIR = path.join(WORK_DIR, 'videos');
const AUDIO_DIR = path.join(WORK_DIR, 'audio');
const IMAGE_DIR = path.join(WORK_DIR, 'images');

// Garantir que os diretórios existam
[WORK_DIR, VIDEO_DIR, AUDIO_DIR, IMAGE_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

console.log(`📁 Diretório de mídia: ${WORK_DIR}`);

// Rota para baixar/visualizar vídeos
app.get('/video/:filename', (req, res) => {
  const filePath = path.join(VIDEO_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Vídeo não encontrado', path: filePath });
  }
  const stat = fs.statSync(filePath);
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunkSize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });
    file.pipe(res);
  } else {
    res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'video/mp4' });
    fs.createReadStream(filePath).pipe(res);
  }
});

// Rota para baixar vídeo diretamente
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(VIDEO_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
  res.download(filePath);
});

// Rota para áudios
app.get('/audio/:filename', (req, res) => {
  const filePath = path.join(AUDIO_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Áudio não encontrado' });
  res.setHeader('Content-Type', 'audio/mpeg');
  fs.createReadStream(filePath).pipe(res);
});

// Rota para imagens
app.get('/images/:filename', (req, res) => {
  const filePath = path.join(IMAGE_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Imagem não encontrada' });
  res.setHeader('Content-Type', 'image/png');
  fs.createReadStream(filePath).pipe(res);
});

// Rota para thumbnails (usa primeira imagem do vídeo)
app.get('/thumbnail/:filename', (req, res) => {
  const base = req.params.filename.replace('.jpg', '');
  const thumbPath = path.join(VIDEO_DIR, `${base}_thumb.jpg`);
  const imgPath = path.join(IMAGE_DIR, `${base}_0.png`);
  const filePath = fs.existsSync(thumbPath) ? thumbPath : fs.existsSync(imgPath) ? imgPath : null;
  if (!filePath) return res.status(404).json({ error: 'Thumbnail não encontrada' });
  res.setHeader('Content-Type', filePath.endsWith('.png') ? 'image/png' : 'image/jpeg');
  fs.createReadStream(filePath).pipe(res);
});

// Listar todos os vídeos gerados
app.get('/media/list', (req, res) => {
  const files = fs.existsSync(VIDEO_DIR)
    ? fs.readdirSync(VIDEO_DIR).filter(f => f.endsWith('.mp4')).map(f => ({
        name: f,
        url: `http://localhost:${PORT}/video/${f}`,
        download: `http://localhost:${PORT}/download/${f}`,
        size: fs.statSync(path.join(VIDEO_DIR, f)).size,
        created: fs.statSync(path.join(VIDEO_DIR, f)).birthtime,
      }))
    : [];
  res.json({ total: files.length, workDir: WORK_DIR, videos: files });
});

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
