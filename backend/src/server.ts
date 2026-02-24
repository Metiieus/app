import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { testConnection, db } from './db';
import { videos, logs, agendamentos, imagensIA, users } from '../database/schema';
import { eq, and, lte, desc, like } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const isWindows = os.platform() === 'win32';

const app = express();
const PORT = process.env.PORT || 3001;

// Diretórios de mídia
const WORK_DIR = path.join(os.tmpdir(), 'tikfactory');
const VIDEO_DIR = path.join(WORK_DIR, 'videos');
const AUDIO_DIR = path.join(WORK_DIR, 'audio');
const IMAGE_DIR = path.join(WORK_DIR, 'images');

function ensureDirs() {
  [WORK_DIR, VIDEO_DIR, AUDIO_DIR, IMAGE_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}
ensureDirs();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de autenticação simples (dev mode)
app.use((req, res, next) => {
  const userId = req.headers['x-user-id'] as string || 'dev-user-001';
  (req as any).userId = userId;
  next();
});

// ============================================================
// SERVIR ARQUIVOS DE MÍDIA
// ============================================================
app.get('/video/:filename', (req, res) => {
  const filePath = path.join(VIDEO_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Vídeo não encontrado', path: filePath });
  const stat = fs.statSync(filePath);
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunkSize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'video/mp4' });
    fs.createReadStream(filePath).pipe(res);
  }
});

app.get('/download/:filename', (req, res) => {
  const filePath = path.join(VIDEO_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Arquivo não encontrado' });
  res.download(filePath);
});

app.get('/audio/:filename', (req, res) => {
  const filePath = path.join(AUDIO_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Áudio não encontrado' });
  res.setHeader('Content-Type', 'audio/mpeg');
  fs.createReadStream(filePath).pipe(res);
});

app.get('/images/:filename', (req, res) => {
  const filePath = path.join(IMAGE_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Imagem não encontrada' });
  res.setHeader('Content-Type', 'image/png');
  fs.createReadStream(filePath).pipe(res);
});

app.get('/thumbnail/:filename', (req, res) => {
  const base = req.params.filename.replace(/\.(jpg|png)$/, '');
  const candidates = [
    path.join(VIDEO_DIR, `${base}_thumb.jpg`),
    path.join(IMAGE_DIR, `${base}_0.png`),
  ];
  const filePath = candidates.find(f => fs.existsSync(f));
  if (!filePath) return res.status(404).json({ error: 'Thumbnail não encontrada' });
  res.setHeader('Content-Type', filePath.endsWith('.png') ? 'image/png' : 'image/jpeg');
  fs.createReadStream(filePath).pipe(res);
});

// ============================================================
// PIPELINE — Funções de geração real
// ============================================================

async function gerarRoteiro(nicho: string, tema: string, duracao: string, estiloNarracao: string, hookInicial?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada no .env');

  const duracaoNum = parseInt(duracao, 10);
  const palavras = Math.round(duracaoNum * 2.5);

  const estilos: Record<string, string> = {
    energetico: 'ENERGÉTICO e ANIMADO, frases curtas e impactantes, ritmo acelerado',
    calmo: 'CALMO e REFLEXIVO, pausas dramáticas, tom suave',
    dramatico: 'DRAMÁTICO e INTENSO, construção de tensão, revelações impactantes',
    informativo: 'INFORMATIVO e DIRETO, claro e objetivo',
  };

  const prompt = `Você é especialista em conteúdo viral para TikTok brasileiro.

Crie um roteiro de narração para TikTok:
- Nicho: ${nicho}
- Tema: ${tema}
- Duração: ${duracao}s (~${palavras} palavras)
- Estilo: ${estilos[estiloNarracao] || estilos.energetico}
${hookInicial ? `- Hook sugerido: "${hookInicial}"` : ''}

REGRAS:
1. Hook nos primeiros 3 segundos — prende atenção IMEDIATAMENTE
2. Linguagem coloquial brasileira
3. Frases curtas (máx 10 palavras)
4. Cria curiosidade ou urgência
5. CTA no final (curtir, seguir, comentar)
6. SEM linguagem formal

Responda APENAS com JSON válido:
{
  "titulo": "Título atrativo (máx 100 chars)",
  "hook": "Frase de abertura impactante (3 segundos)",
  "roteiro": "Texto completo para narração, sem marcações de cena",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
}`;

  // Tenta múltiplos modelos em ordem de preferência
  const modelos = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.5-pro-latest',
    'gemini-2.0-flash',
  ];

  let data: any = null;
  let lastError = '';
  for (const modelo of modelos) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9, maxOutputTokens: 1024 },
          }),
        }
      );
      if (resp.ok) { data = await resp.json(); console.log(`✅ Gemini modelo usado: ${modelo}`); break; }
      const errText = await resp.text();
      lastError = `${modelo}: ${resp.status} ${errText}`;
      console.warn(`⚠️ Modelo ${modelo} falhou (${resp.status}), tentando próximo...`);
    } catch (e) {
      lastError = String(e);
      console.warn(`⚠️ Modelo ${modelo} erro de rede, tentando próximo...`);
    }
  }
  if (!data) throw new Error(`Todos os modelos Gemini falharam. Último erro: ${lastError}`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('JSON não encontrado na resposta do Gemini');

  const result = JSON.parse(match[0]);
  return {
    titulo: result.titulo || tema,
    hook: result.hook || '',
    roteiro: result.roteiro || tema,
    hashtags: result.hashtags || [],
  };
}

async function gerarNarracao(roteiro: string, estiloNarracao: string, videoId: string): Promise<string | null> {
  try {
    ensureDirs();
    const vozes: Record<string, { voice: string; rate: string }> = {
      energetico: { voice: 'pt-BR-AntonioNeural', rate: '+15%' },
      calmo: { voice: 'pt-BR-FranciscaNeural', rate: '-10%' },
      dramatico: { voice: 'pt-BR-AntonioNeural', rate: '+5%' },
      informativo: { voice: 'pt-BR-FranciscaNeural', rate: '+0%' },
    };
    const config = vozes[estiloNarracao] || vozes.energetico;
    const audioFile = path.join(AUDIO_DIR, `${videoId}.mp3`);
    const textFile = path.join(WORK_DIR, `${videoId}.txt`);
    fs.writeFileSync(textFile, roteiro, 'utf8');

    const cmd = isWindows
      ? `python -m edge_tts --voice "${config.voice}" --rate "${config.rate}" --file "${textFile}" --write-media "${audioFile}"`
      : `edge-tts --voice "${config.voice}" --rate "${config.rate}" --file "${textFile}" --write-media "${audioFile}"`;

    await execAsync(cmd);
    if (fs.existsSync(textFile)) fs.unlinkSync(textFile);
    return fs.existsSync(audioFile) ? audioFile : null;
  } catch (e) {
    console.error('Edge TTS erro:', e);
    return null;
  }
}

async function gerarImagemGemini(nicho: string, tema: string, index: number, videoId: string): Promise<string | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    ensureDirs();

    const promptsNicho: Record<string, string> = {
      motivacional: 'motivational lifestyle, person achieving success, golden hour, vibrant colors, cinematic',
      curiosidades: 'stunning nature, mind-blowing visualization, dramatic lighting, photorealistic',
      humor: 'funny relatable situation, bright colors, expressive',
      educativo: 'educational visual, clean modern design, infographic style',
      lifestyle: 'aesthetic lifestyle photography, minimalist, trendy',
      financas: 'financial success, money growth, professional clean design',
      tecnologia: 'futuristic technology, digital art, neon colors',
      saude: 'healthy lifestyle, fitness, natural lighting, energetic',
      receitas: 'food photography, delicious meal, professional lighting',
      relacionamentos: 'connection, warm colors, emotional, heartfelt',
      negocios: 'professional business, entrepreneurship, modern',
      espiritualidade: 'spiritual meditation, peaceful nature, soft light, zen',
    };

    const nichoPrompt = promptsNicho[nicho] || 'viral TikTok content, engaging visual';
    const imagePrompt = `${nichoPrompt}, about "${tema}", vertical format 9:16, ultra high quality, ${index === 0 ? 'eye-catching hook visual' : `scene ${index + 1}`}, no text overlay`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: imagePrompt }],
          parameters: { sampleCount: 1, aspectRatio: '9:16', safetyFilterLevel: 'block_some', personGeneration: 'allow_adult' },
        }),
      }
    );

    if (!response.ok) {
      console.error(`Gemini Imagen erro: ${response.status}`, await response.text());
      return null;
    }

    const data = await response.json();
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64Image) return null;

    const imageFile = path.join(IMAGE_DIR, `${videoId}_${index}.png`);
    fs.writeFileSync(imageFile, Buffer.from(base64Image, 'base64'));
    return imageFile;
  } catch (e) {
    console.error('Gemini Imagen erro:', e);
    return null;
  }
}

async function montarVideo(videoId: string, audioFile: string | null, imagensFiles: string[], duracao: string): Promise<string | null> {
  try {
    ensureDirs();
    await execAsync('ffmpeg -version').catch(() => { throw new Error('FFmpeg não encontrado no PATH'); });

    const duracaoNum = parseInt(duracao, 10);
    const outputFile = path.join(VIDEO_DIR, `${videoId}.mp4`);
    const outputNorm = outputFile.replace(/\\/g, '/');

    if (imagensFiles.length === 0) {
      // Fundo gradiente + áudio
      const audioInput = audioFile ? `-i "${audioFile.replace(/\\/g, '/')}"` : '';
      const audioMap = audioFile ? '-map 1:a -c:a aac' : '';
      const cmd = `ffmpeg -y -f lavfi -i "color=c=0x1a0a2e:s=1080x1920:r=30:d=${duracaoNum}" ${audioInput} -map 0:v ${audioMap} -c:v libx264 -t ${duracaoNum} -pix_fmt yuv420p "${outputNorm}"`;
      await execAsync(cmd);
    } else {
      // Slideshow com imagens + áudio
      const duracaoPorImagem = duracaoNum / imagensFiles.length;
      const listFile = path.join(WORK_DIR, `${videoId}_list.txt`);
      const listContent = imagensFiles.map(f =>
        `file '${f.replace(/\\/g, '/').replace(/'/g, "\\'")}'\nduration ${duracaoPorImagem.toFixed(2)}`
      ).join('\n');
      // Adicionar última imagem sem duração (necessário para ffmpeg concat)
      const lastImg = imagensFiles[imagensFiles.length - 1];
      const finalContent = listContent + `\nfile '${lastImg.replace(/\\/g, '/').replace(/'/g, "\\'")}'`;
      fs.writeFileSync(listFile, finalContent, 'utf8');

      const audioInput = audioFile ? `-i "${audioFile.replace(/\\/g, '/')}"` : '';
      const audioMap = audioFile ? '-map 1:a -c:a aac -shortest' : '';
      const cmd = `ffmpeg -y -f concat -safe 0 -i "${listFile.replace(/\\/g, '/')}" ${audioInput} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1" -map 0:v ${audioMap} -c:v libx264 -t ${duracaoNum} -r 30 -pix_fmt yuv420p "${outputNorm}"`;
      await execAsync(cmd);
      if (fs.existsSync(listFile)) fs.unlinkSync(listFile);
    }

    return fs.existsSync(outputFile) ? outputFile : null;
  } catch (e) {
    console.error('FFmpeg erro:', e);
    return null;
  }
}

async function executarPipeline(videoId: string, userId: string) {
  const addLog = async (tipo: string, etapa: string, mensagem: string, detalhes?: string) => {
    try {
      await db.insert(logs).values({ id: randomUUID(), userId, videoId, tipo: tipo as any, etapa: etapa as any, mensagem, detalhes });
    } catch (e) { console.error('Log erro:', e); }
  };

  try {
    const video = await db.query.videos.findFirst({ where: eq(videos.id, videoId) });
    if (!video) throw new Error('Vídeo não encontrado');

    await db.update(videos).set({ status: 'processando' }).where(eq(videos.id, videoId));

    // ETAPA 1: ROTEIRO
    await addLog('info', 'roteiro', '🤖 Gerando roteiro viral com Gemini AI...');
    const { roteiro, hashtags, titulo, hook } = await gerarRoteiro(
      video.nicho, video.tema, video.duracao, video.estiloNarracao, video.hookInicial || undefined
    );
    await db.update(videos).set({ roteiro, hashtags, titulo }).where(eq(videos.id, videoId));
    await addLog('sucesso', 'roteiro', `✅ Roteiro gerado! Hook: "${hook.substring(0, 80)}"`);

    // ETAPA 2: NARRAÇÃO
    await addLog('info', 'narracao', '🎙️ Gerando narração com Edge TTS (pt-BR)...');
    const audioFile = await gerarNarracao(roteiro, video.estiloNarracao, videoId);
    if (audioFile) {
      await db.update(videos).set({ audioUrl: `/audio/${videoId}.mp3` }).where(eq(videos.id, videoId));
      await addLog('sucesso', 'narracao', '✅ Narração gerada com sucesso!');
    } else {
      await addLog('aviso', 'narracao', '⚠️ Edge TTS falhou — vídeo sem narração. Execute: pip install edge-tts');
    }

    // ETAPA 3: IMAGENS
    await addLog('info', 'imagem', '🎨 Gerando imagens 9:16 com Gemini Imagen...');
    const numImagens = Math.max(1, Math.ceil(parseInt(video.duracao, 10) / 10));
    const imagensGeradas: string[] = [];
    for (let i = 0; i < numImagens; i++) {
      await addLog('info', 'imagem', `🖼️ Gerando imagem ${i + 1}/${numImagens}...`);
      const imgFile = await gerarImagemGemini(video.nicho, video.tema, i, videoId);
      if (imgFile) {
        imagensGeradas.push(imgFile);
        await db.insert(imagensIA).values({
          id: randomUUID(), userId, videoId,
          prompt: `${video.nicho} - ${video.tema} - cena ${i + 1}`,
          url: `/images/${videoId}_${i}.png`,
          modelo: 'gemini-imagen-3', formato: '1080x1920',
        });
      }
    }
    if (imagensGeradas.length > 0) {
      await addLog('sucesso', 'imagem', `✅ ${imagensGeradas.length} imagens geradas!`);
    } else {
      await addLog('aviso', 'imagem', '⚠️ Gemini Imagen indisponível — usando fundo padrão');
    }

    // ETAPA 4: VÍDEO
    await addLog('info', 'video', '🎬 Montando vídeo 1080x1920 com FFmpeg...');
    const videoFile = await montarVideo(videoId, audioFile, imagensGeradas, video.duracao);
    if (videoFile) {
      await db.update(videos).set({ videoUrl: `/video/${videoId}.mp4` }).where(eq(videos.id, videoId));
      await addLog('sucesso', 'video', `✅ Vídeo MP4 gerado! (${video.duracao}s, 1080x1920, 30fps)`);
    } else {
      await addLog('erro', 'video', '❌ FFmpeg falhou ao montar o vídeo');
    }

    // ETAPA 5: THUMBNAIL
    await addLog('info', 'thumbnail', '🖼️ Gerando thumbnail...');
    if (imagensGeradas.length > 0) {
      const thumbOut = path.join(VIDEO_DIR, `${videoId}_thumb.jpg`);
      try {
        await execAsync(`ffmpeg -y -i "${imagensGeradas[0].replace(/\\/g, '/')}" -vf "scale=1080:1920" "${thumbOut.replace(/\\/g, '/')}"`);
      } catch { /* usa imagem original */ }
    }
    await db.update(videos).set({ thumbnailUrl: `/thumbnail/${videoId}.jpg` }).where(eq(videos.id, videoId));
    await addLog('sucesso', 'thumbnail', '✅ Thumbnail gerada!');

    // STATUS FINAL
    await db.update(videos).set({ status: videoFile ? 'concluido' : 'erro' }).where(eq(videos.id, videoId));
    await addLog('sucesso', 'geral', videoFile ? '🚀 Vídeo pronto! Acesse o Histórico para assistir.' : '⚠️ Pipeline concluído com erros.');

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    await db.update(videos).set({ status: 'erro', erro: msg }).where(eq(videos.id, videoId));
    await addLog('erro', 'geral', `❌ Erro no pipeline: ${msg}`);
    console.error('Pipeline erro:', error);
  }
}

// ============================================================
// ROTAS REST — /api/*
// ============================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'TikFactory', workDir: WORK_DIR });
});

// --- VÍDEOS ---
app.post('/api/videos', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { titulo, nicho, tema, duracao, estiloNarracao, hookInicial, legendasAnimadas, musicaTrending, efeitos, autoPublicar } = req.body;
    if (!titulo || !nicho || !tema) return res.status(400).json({ error: 'titulo, nicho e tema são obrigatórios' });

    const videoId = randomUUID();
    await db.insert(videos).values({
      id: videoId, userId, titulo, nicho, tema,
      descricao: tema,
      duracao: duracao || '30',
      estiloNarracao: estiloNarracao || 'energetico',
      hookInicial: hookInicial || null,
      status: 'pendente', hashtags: [],
      usarIA: true,
      legendasAnimadas: legendasAnimadas ?? true,
      musicaTrending: musicaTrending ?? true,
      efeitos: efeitos ?? true,
      autoPublicar: autoPublicar ?? false,
    });

    // Iniciar pipeline em background
    executarPipeline(videoId, userId).catch(console.error);

    res.json({ success: true, videoId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/videos', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { status, busca } = req.query as Record<string, string>;

    let conditions = eq(videos.userId, userId);
    if (status && status !== 'todos') conditions = and(conditions, eq(videos.status, status as any))!;
    if (busca) conditions = and(conditions, like(videos.titulo, `%${busca}%`))!;

    const items = await db.query.videos.findMany({
      where: conditions,
      orderBy: desc(videos.criadoEm),
      limit: 50,
    });

    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/videos/stats', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const userVideos = await db.query.videos.findMany({ where: eq(videos.userId, userId) });
    const total = userVideos.length;
    const publicados = userVideos.filter(v => v.status === 'publicado').length;
    const concluidos = userVideos.filter(v => v.status === 'concluido').length;
    const comErro = userVideos.filter(v => v.status === 'erro').length;
    const totalViews = userVideos.reduce((acc, v) => acc + (v.tiktokViews || 0), 0);
    const totalLikes = userVideos.reduce((acc, v) => acc + (v.tiktokLikes || 0), 0);

    const hoje = new Date();
    const videosPorDia = [];
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      const dataStr = data.toISOString().split('T')[0];
      const count = userVideos.filter(v => v.criadoEm.toISOString().split('T')[0] === dataStr).length;
      videosPorDia.push({ data: dataStr, count });
    }

    res.json({ total, publicados, concluidos, comErro, totalViews, totalLikes, videosPorDia });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    const userId = (req as any).userId;
    await db.delete(videos).where(and(eq(videos.id, req.params.id), eq(videos.userId, userId)));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- PIPELINE ---
app.post('/api/pipeline/:videoId', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { videoId } = req.params;
    executarPipeline(videoId, userId).catch(console.error);
    res.json({ success: true, message: 'Pipeline iniciado' });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/pipeline/:videoId/status', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const video = await db.query.videos.findFirst({ where: eq(videos.id, req.params.videoId) });
    if (!video) return res.status(404).json({ error: 'Vídeo não encontrado' });

    const logsRecentes = await db.query.logs.findMany({
      where: eq(logs.videoId, req.params.videoId),
      orderBy: desc(logs.criadoEm),
      limit: 30,
    });

    const etapas = ['roteiro', 'narracao', 'imagem', 'video', 'thumbnail'];
    const concluidas = new Set(logsRecentes.filter(l => l.tipo === 'sucesso').map(l => l.etapa));
    const progresso = Math.min(Math.round((concluidas.size / etapas.length) * 100), 100);

    res.json({ videoId: req.params.videoId, status: video.status, progresso, logs: logsRecentes, videoUrl: video.videoUrl, thumbnailUrl: video.thumbnailUrl });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- LOGS ---
app.get('/api/logs', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { videoId } = req.query as Record<string, string>;
    let conditions = eq(logs.userId, userId);
    if (videoId) conditions = and(conditions, eq(logs.videoId, videoId))!;
    const items = await db.query.logs.findMany({ where: conditions, orderBy: desc(logs.criadoEm), limit: 100 });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- AGENDAMENTOS ---
app.get('/api/agendamentos', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const items = await db.query.agendamentos.findMany({ where: eq(agendamentos.userId, userId), orderBy: desc(agendamentos.criadoEm) });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/agendamentos', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { nicho, descricao, tipo, horario, proximaExecucao } = req.body;
    const id = randomUUID();
    await db.insert(agendamentos).values({ id, userId, nicho, descricao, tipo, horario: horario || '18:00', proximaExecucao: new Date(proximaExecucao), ativo: true, videosGerados: 0 });
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.put('/api/agendamentos/:id', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { ativo } = req.body;
    await db.update(agendamentos).set({ ativo }).where(and(eq(agendamentos.id, req.params.id), eq(agendamentos.userId, userId)));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.delete('/api/agendamentos/:id', async (req, res) => {
  try {
    const userId = (req as any).userId;
    await db.delete(agendamentos).where(and(eq(agendamentos.id, req.params.id), eq(agendamentos.userId, userId)));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ============================================================
// SCHEDULER
// ============================================================
let schedulerAtivo = true;

cron.schedule('*/1 * * * *', async () => {
  if (!schedulerAtivo) return;
  const agora = new Date();
  try {
    const pendentes = await db.query.agendamentos.findMany({
      where: and(eq(agendamentos.ativo, true), lte(agendamentos.proximaExecucao, agora)),
    });

    for (const ag of pendentes) {
      const videoId = randomUUID();
      await db.insert(videos).values({
        id: videoId, userId: ag.userId,
        titulo: `${ag.nicho} — ${new Date().toLocaleDateString('pt-BR')}`,
        nicho: ag.nicho, tema: ag.nicho, descricao: ag.descricao,
        duracao: '30', estiloNarracao: 'energetico', status: 'pendente',
        hashtags: [], usarIA: true, legendasAnimadas: true, musicaTrending: true, efeitos: true, autoPublicar: true,
      });

      let novaData = new Date(agora);
      if (ag.tipo === 'uma_vez') {
        await db.update(agendamentos).set({ ativo: false, ultimaExecucao: agora, videosGerados: (ag.videosGerados || 0) + 1 }).where(eq(agendamentos.id, ag.id));
      } else {
        if (ag.tipo === 'diaria') novaData.setDate(novaData.getDate() + 1);
        else if (ag.tipo === 'semanal') novaData.setDate(novaData.getDate() + 7);
        else if (ag.tipo === 'mensal') novaData.setMonth(novaData.getMonth() + 1);
        if (ag.horario) { const [h, m] = ag.horario.split(':').map(Number); novaData.setHours(h, m, 0, 0); }
        await db.update(agendamentos).set({ ultimaExecucao: agora, proximaExecucao: novaData, videosGerados: (ag.videosGerados || 0) + 1 }).where(eq(agendamentos.id, ag.id));
      }

      executarPipeline(videoId, ag.userId).catch(console.error);
      console.log(`🤖 Agendamento executado — nicho: ${ag.nicho}, vídeo: ${videoId}`);
    }
  } catch (e) {
    console.error('Scheduler erro:', e);
  }
});

app.post('/scheduler/:acao', (req, res) => {
  schedulerAtivo = req.params.acao === 'start';
  res.json({ status: 'ok', ativo: schedulerAtivo });
});

// ============================================================
// INICIAR
// ============================================================
async function ensureDevUser() {
  const DEV_USER_ID = 'dev-user-001';
  try {
    const existing = await db.query.users.findFirst({ where: eq(users.id, DEV_USER_ID) });
    if (!existing) {
      await db.insert(users).values({
        id: DEV_USER_ID,
        openId: 'dev-open-id-001',
        name: 'Dev User',
        email: 'dev@tikfactory.local',
        role: 'admin',
      });
      console.log('✅ Usuário dev criado no banco');
    }
  } catch (e) {
    console.error('Aviso: não foi possível criar usuário dev:', e);
  }
}

async function startServer() {
  const conectado = await testConnection();
  if (!conectado) { console.error('❌ Banco de dados não conectado'); process.exit(1); }
  await ensureDevUser();

  app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ================================');
    console.log('   TikFactory — Máquina de Vídeos');
    console.log('================================');
    console.log(`📡 API:       http://localhost:${PORT}`);
    console.log(`📁 Mídia:     ${WORK_DIR}`);
    console.log(`⚙️  Scheduler: ▶️  Ativo`);
    console.log('================================');
    console.log('');
  });
}

startServer().catch(console.error);
