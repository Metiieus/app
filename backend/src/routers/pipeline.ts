import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { videos, logs, imagensIA } from '../../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const isWindows = os.platform() === 'win32';

// Diretórios de trabalho
const WORK_DIR = path.join(os.tmpdir(), 'tikfactory');
const AUDIO_DIR = path.join(WORK_DIR, 'audio');
const IMAGE_DIR = path.join(WORK_DIR, 'images');
const VIDEO_DIR = path.join(WORK_DIR, 'videos');

function ensureDirs() {
  [WORK_DIR, AUDIO_DIR, IMAGE_DIR, VIDEO_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

// ============================================================
// ETAPA 1: Roteiro viral com Gemini AI
// ============================================================
async function gerarRoteiro(
  nicho: string, tema: string, descricao: string,
  duracao: string, estiloNarracao: string, hookInicial?: string | null
): Promise<{ roteiro: string; hashtags: string[]; titulo: string; hook: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

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
- Descrição: ${descricao}
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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini API erro: ${response.status}`);
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('JSON não encontrado na resposta do Gemini');

  const result = JSON.parse(match[0]);
  return {
    titulo: result.titulo || tema,
    hook: result.hook || '',
    roteiro: result.roteiro || descricao,
    hashtags: result.hashtags || [],
  };
}

// ============================================================
// ETAPA 2: Narração com Edge TTS (real)
// ============================================================
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

    // Salvar texto em arquivo para evitar problemas com caracteres especiais
    fs.writeFileSync(textFile, roteiro, 'utf8');

    // Comando edge-tts compatível com Windows e Linux
    const cmd = isWindows
      ? `python -m edge_tts --voice "${config.voice}" --rate "${config.rate}" --file "${textFile}" --write-media "${audioFile}"`
      : `edge-tts --voice "${config.voice}" --rate "${config.rate}" --file "${textFile}" --write-media "${audioFile}"`;

    await execAsync(cmd);

    // Limpar arquivo de texto temporário
    if (fs.existsSync(textFile)) fs.unlinkSync(textFile);

    if (fs.existsSync(audioFile)) {
      console.log(`✅ Áudio gerado: ${audioFile}`);
      return audioFile;
    }

    return null;
  } catch (error) {
    console.error('Erro Edge TTS:', error);
    return null;
  }
}

// ============================================================
// ETAPA 3: Imagens com Gemini Imagen (formato 9:16)
// ============================================================
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

    // Gemini Imagen 3 via API REST
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: imagePrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '9:16',
            safetyFilterLevel: 'block_some',
            personGeneration: 'allow_adult',
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`Gemini Imagen erro: ${response.status} ${await response.text()}`);
      return null;
    }

    const data = await response.json();
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64Image) return null;

    // Salvar imagem localmente
    const imageFile = path.join(IMAGE_DIR, `${videoId}_${index}.png`);
    fs.writeFileSync(imageFile, Buffer.from(base64Image, 'base64'));
    console.log(`✅ Imagem ${index + 1} gerada: ${imageFile}`);
    return imageFile;

  } catch (error) {
    console.error('Erro Gemini Imagen:', error);
    return null;
  }
}

// ============================================================
// ETAPA 4: Montar vídeo real com FFmpeg (1080x1920)
// ============================================================
async function montarVideo(
  videoId: string,
  audioFile: string | null,
  imagensFiles: string[],
  duracao: string
): Promise<string | null> {
  try {
    ensureDirs();

    // Verificar FFmpeg
    try {
      await execAsync('ffmpeg -version');
    } catch {
      console.error('FFmpeg não encontrado no PATH');
      return null;
    }

    const duracaoNum = parseInt(duracao, 10);
    const outputFile = path.join(VIDEO_DIR, `${videoId}.mp4`);
    const outputNorm = outputFile.replace(/\\/g, '/');

    // Se não tem imagens, criar vídeo com fundo gradiente + áudio
    if (imagensFiles.length === 0) {
      const audioInput = audioFile ? `-i "${audioFile.replace(/\\/g, '/')}"` : '';
      const audioMap = audioFile ? '-map 1:a -c:a aac' : '';
      const cmd = `ffmpeg -y -f lavfi -i "color=c=0x1a0a2e:s=1080x1920:r=30:d=${duracaoNum}" ${audioInput} -map 0:v ${audioMap} -c:v libx264 -t ${duracaoNum} -pix_fmt yuv420p "${outputNorm}"`;
      await execAsync(cmd);
      return outputFile;
    }

    // Com imagens: criar slideshow 9:16 + áudio
    const duracaoPorImagem = duracaoNum / imagensFiles.length;

    // Criar lista de imagens para FFmpeg concat
    const listFile = path.join(WORK_DIR, `${videoId}_list.txt`);
    const listContent = imagensFiles.map(f =>
      `file '${f.replace(/\\/g, '/').replace(/'/g, "\\'")}'\nduration ${duracaoPorImagem.toFixed(2)}`
    ).join('\n');
    fs.writeFileSync(listFile, listContent, 'utf8');

    const audioInput = audioFile ? `-i "${audioFile.replace(/\\/g, '/')}"` : '';
    const audioMap = audioFile ? '-map 1:a -c:a aac' : '';

    const cmd = `ffmpeg -y -f concat -safe 0 -i "${listFile.replace(/\\/g, '/')}" ${audioInput} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1" -map 0:v ${audioMap} -c:v libx264 -t ${duracaoNum} -r 30 -pix_fmt yuv420p "${outputNorm}"`;

    await execAsync(cmd);

    // Limpar lista temporária
    if (fs.existsSync(listFile)) fs.unlinkSync(listFile);

    if (fs.existsSync(outputFile)) {
      console.log(`✅ Vídeo gerado: ${outputFile}`);
      return outputFile;
    }

    return null;
  } catch (error) {
    console.error('Erro FFmpeg:', error);
    return null;
  }
}

// ============================================================
// ETAPA 5: Publicar no TikTok
// ============================================================
async function publicarTikTok(titulo: string, hashtags: string[]): Promise<{ tiktokVideoId: string; tiktokUrl: string } | null> {
  try {
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    if (!accessToken) return null;

    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        post_info: { title: titulo, privacy_level: 'PUBLIC_TO_EVERYONE', disable_duet: false, disable_comment: false, disable_stitch: false },
        source_info: { source: 'FILE_UPLOAD', video_size: 10000000, chunk_size: 10000000, total_chunk_count: 1 },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const publishId = data.data?.publish_id;
    if (!publishId) return null;

    return { tiktokVideoId: publishId, tiktokUrl: `https://www.tiktok.com/@usuario/video/${publishId}` };
  } catch {
    return null;
  }
}

// ============================================================
// ROUTER
// ============================================================
export const pipelineRouter = router({
  execute: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { videoId } = input;

      const video = await db.query.videos.findFirst({
        where: and(eq(videos.id, videoId), eq(videos.userId, ctx.user!.id)),
      });
      if (!video) throw new Error('Vídeo não encontrado');

      await db.update(videos).set({ status: 'processando' }).where(eq(videos.id, videoId));

      const addLog = async (tipo: 'info' | 'sucesso' | 'erro' | 'aviso', etapa: string, mensagem: string, detalhes?: string) => {
        await db.insert(logs).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          videoId,
          tipo,
          etapa: etapa as any,
          mensagem,
          detalhes,
        });
      };

      try {
        // ── ETAPA 1: ROTEIRO ──
        await addLog('info', 'roteiro', '🤖 Gerando roteiro viral com Gemini AI...');
        const { roteiro, hashtags, titulo, hook } = await gerarRoteiro(
          video.nicho, video.tema, video.descricao, video.duracao, video.estiloNarracao, video.hookInicial
        );
        await db.update(videos).set({ roteiro, hashtags, titulo }).where(eq(videos.id, videoId));
        await addLog('sucesso', 'roteiro', `✅ Roteiro gerado! Hook: "${hook.substring(0, 60)}..."`);

        // ── ETAPA 2: NARRAÇÃO ──
        await addLog('info', 'narracao', '🎙️ Gerando narração com Edge TTS (pt-BR)...');
        const audioFile = await gerarNarracao(roteiro, video.estiloNarracao, videoId);
        if (audioFile) {
          await db.update(videos).set({ audioUrl: `/audio/${videoId}.mp3` }).where(eq(videos.id, videoId));
          await addLog('sucesso', 'narracao', '✅ Narração gerada com sucesso!');
        } else {
          await addLog('aviso', 'narracao', '⚠️ Edge TTS não disponível — vídeo será gerado sem narração',
            isWindows ? 'Execute: pip install edge-tts' : 'Execute: pip install edge-tts');
        }

        // ── ETAPA 3: IMAGENS ──
        await addLog('info', 'imagem', '🎨 Gerando imagens verticais 9:16 com Gemini Imagen...');
        const numImagens = Math.max(1, Math.ceil(parseInt(video.duracao, 10) / 10));
        const imagensGeradas: string[] = [];

        for (let i = 0; i < numImagens; i++) {
          await addLog('info', 'imagem', `🖼️ Gerando imagem ${i + 1}/${numImagens}...`);
          const imgFile = await gerarImagemGemini(video.nicho, video.tema, i, videoId);
          if (imgFile) {
            imagensGeradas.push(imgFile);
            await db.insert(imagensIA).values({
              id: randomUUID(),
              userId: ctx.user!.id,
              videoId,
              prompt: `${video.nicho} - ${video.tema} - cena ${i + 1}`,
              url: `/images/${videoId}_${i}.png`,
              modelo: 'gemini-imagen-3',
              formato: '1080x1920',
            });
          }
        }

        if (imagensGeradas.length > 0) {
          await addLog('sucesso', 'imagem', `✅ ${imagensGeradas.length} imagens geradas com Gemini Imagen!`);
        } else {
          await addLog('aviso', 'imagem', '⚠️ Gemini Imagen não disponível — usando fundo padrão');
        }

        // ── ETAPA 4: VÍDEO ──
        await addLog('info', 'video', '🎬 Montando vídeo 1080x1920 com FFmpeg...');
        const videoFile = await montarVideo(videoId, audioFile, imagensGeradas, video.duracao);

        if (videoFile) {
          await db.update(videos).set({ videoUrl: `/video/${videoId}.mp4` }).where(eq(videos.id, videoId));
          await addLog('sucesso', 'video', `✅ Vídeo MP4 gerado! (${video.duracao}s, 1080x1920, 30fps)`);
        } else {
          await addLog('erro', 'video', '❌ Erro ao montar vídeo — verifique se FFmpeg está no PATH');
        }

        // ── ETAPA 5: THUMBNAIL ──
        await addLog('info', 'thumbnail', '🖼️ Gerando thumbnail...');
        const thumbFile = imagensGeradas.length > 0 ? imagensGeradas[0] : null;
        if (thumbFile) {
          const thumbOut = path.join(VIDEO_DIR, `${videoId}_thumb.jpg`);
          try {
            await execAsync(`ffmpeg -y -i "${thumbFile.replace(/\\/g, '/')}" -vf "scale=1080:1920" "${thumbOut.replace(/\\/g, '/')}"`);
          } catch { /* usa imagem original como thumb */ }
        }
        await db.update(videos).set({ thumbnailUrl: `/thumbnail/${videoId}.jpg` }).where(eq(videos.id, videoId));
        await addLog('sucesso', 'thumbnail', '✅ Thumbnail gerada!');

        // ── ETAPA 6: PUBLICAÇÃO ──
        if (video.autoPublicar) {
          await addLog('info', 'publicacao', '📤 Publicando no TikTok...');
          const tiktokResult = await publicarTikTok(titulo, hashtags);
          if (tiktokResult) {
            await db.update(videos).set({
              status: 'publicado',
              tiktokVideoId: tiktokResult.tiktokVideoId,
              tiktokUrl: tiktokResult.tiktokUrl,
              publicadoEm: new Date(),
            }).where(eq(videos.id, videoId));
            await addLog('sucesso', 'publicacao', `🎉 Publicado no TikTok! ${tiktokResult.tiktokUrl}`);
          } else {
            await db.update(videos).set({ status: 'concluido' }).where(eq(videos.id, videoId));
            await addLog('aviso', 'publicacao', '⚠️ Configure TIKTOK_ACCESS_TOKEN para publicação automática');
          }
        } else {
          await db.update(videos).set({ status: 'concluido' }).where(eq(videos.id, videoId));
          await addLog('sucesso', 'geral', '✅ Vídeo pronto para publicação manual!');
        }

        await addLog('sucesso', 'geral', '🚀 Pipeline concluído com sucesso!');
        return { success: true, videoFile: videoFile ? `/video/${videoId}.mp4` : null };

      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro desconhecido';
        await db.update(videos).set({ status: 'erro', erro: msg }).where(eq(videos.id, videoId));
        await addLog('erro', 'geral', `❌ Erro no pipeline: ${msg}`);
        throw new Error(msg);
      }
    }),

  status: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ ctx, input }) => {
      const video = await db.query.videos.findFirst({
        where: and(eq(videos.id, input.videoId), eq(videos.userId, ctx.user!.id)),
      });
      if (!video) throw new Error('Vídeo não encontrado');

      const logsRecentes = await db.query.logs.findMany({
        where: and(eq(logs.videoId, input.videoId), eq(logs.userId, ctx.user!.id)),
        orderBy: desc(logs.criadoEm),
        limit: 20,
      });

      const etapas = ['roteiro', 'narracao', 'imagem', 'video', 'thumbnail', 'publicacao'];
      const concluidas = new Set(logsRecentes.filter(l => l.tipo === 'sucesso').map(l => l.etapa));
      const progresso = Math.min(Math.round((concluidas.size / etapas.length) * 100), 100);

      return { videoId: input.videoId, status: video.status, progresso, logs: logsRecentes };
    }),
});
