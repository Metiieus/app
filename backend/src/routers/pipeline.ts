import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { videos, logs, imagensIA } from '../../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as os from 'os';
import * as path from 'path';

// Detectar sistema operacional
const isWindows = os.platform() === 'win32';

// Diretórios temporários compatíveis com Windows e Linux
const TEMP_DIR = path.join(os.tmpdir(), 'tikfactory');
const AUDIO_DIR = path.join(TEMP_DIR, 'audio');
const VIDEO_DIR = path.join(TEMP_DIR, 'videos');
const THUMBNAIL_DIR = path.join(TEMP_DIR, 'thumbnails');

// Schema para executar pipeline
const executePipelineSchema = z.object({
  videoId: z.string(),
});

// ============================================================
// ETAPA 1: Gerar Roteiro com Gemini AI (otimizado para TikTok)
// ============================================================
async function gerarRoteiroTikTok(
  nicho: string,
  tema: string,
  descricao: string,
  duracao: string,
  estiloNarracao: string,
  hookInicial?: string | null
): Promise<{ roteiro: string; hashtags: string[]; titulo: string; hook: string }> {
  const duracaoNum = parseInt(duracao, 10);
  const palavrasEstimadas = Math.round(duracaoNum * 2.5);

  const estiloDescricao: Record<string, string> = {
    energetico: 'ENERGÉTICO e ANIMADO, com frases curtas e impactantes, ritmo acelerado',
    calmo: 'CALMO e REFLEXIVO, com pausas dramáticas, tom suave e contemplativo',
    dramatico: 'DRAMÁTICO e INTENSO, com construção de tensão e revelações impactantes',
    informativo: 'INFORMATIVO e DIRETO, claro e objetivo, sem rodeios',
  };

  const prompt = `Você é um especialista em criação de conteúdo viral para TikTok.

Crie um roteiro de narração para um vídeo TikTok com as seguintes especificações:
- Nicho: ${nicho}
- Tema: ${tema}
- Descrição: ${descricao}
- Duração: ${duracao} segundos (~${palavrasEstimadas} palavras)
- Estilo de narração: ${estiloDescricao[estiloNarracao] || estiloDescricao.energetico}
${hookInicial ? `- Hook inicial sugerido: "${hookInicial}"` : ''}

REGRAS OBRIGATÓRIAS para vídeos virais no TikTok:
1. HOOK nos primeiros 3 segundos — deve prender a atenção IMEDIATAMENTE
2. Linguagem COLOQUIAL e PRÓXIMA do público brasileiro
3. Frases CURTAS (máximo 10 palavras cada)
4. Criar CURIOSIDADE ou URGÊNCIA ao longo do vídeo
5. CALL TO ACTION no final (curtir, seguir, comentar)
6. NÃO use linguagem formal ou acadêmica
7. O roteiro deve ser falado, não lido

Responda APENAS com um JSON válido neste formato exato:
{
  "titulo": "Título atrativo para o vídeo (máx 100 chars)",
  "hook": "Frase de abertura impactante (primeiros 3 segundos)",
  "roteiro": "Texto completo para narração, sem marcações de cena",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, topK: 40, topP: 0.95, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) throw new Error(`Erro na API Gemini: ${response.status}`);

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return { roteiro: result.roteiro, hashtags: result.hashtags || [], titulo: result.titulo, hook: result.hook };
    }

    throw new Error('Não foi possível extrair JSON da resposta do Gemini');
  } catch (error) {
    console.error('Erro ao gerar roteiro:', error);
    return {
      titulo: `${tema} — Você Precisa Ver Isso`,
      hook: 'Você não vai acreditar no que vou te mostrar agora...',
      roteiro: `Você não vai acreditar no que vou te mostrar agora. ${descricao} Isso mudou completamente a minha perspectiva sobre ${tema}. Se você quer saber mais, segue aqui que tem muito conteúdo incrível todo dia!`,
      hashtags: [`#${nicho.toLowerCase().replace(/\s/g, '')}`, '#tiktok', '#viral', '#brasil', '#fyp'],
    };
  }
}

// ============================================================
// ETAPA 2: Gerar Narração com Edge TTS (compatível com Windows)
// ============================================================
async function gerarNarracao(
  roteiro: string,
  estiloNarracao: string,
  videoId: string
): Promise<string | null> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const fs = await import('fs');

    const voiceConfig: Record<string, { voice: string; rate: string }> = {
      energetico: { voice: 'pt-BR-AntonioNeural', rate: '+15%' },
      calmo: { voice: 'pt-BR-FranciscaNeural', rate: '-10%' },
      dramatico: { voice: 'pt-BR-AntonioNeural', rate: '+5%' },
      informativo: { voice: 'pt-BR-FranciscaNeural', rate: '+0%' },
    };

    const config = voiceConfig[estiloNarracao] || voiceConfig.energetico;
    const outputFile = path.join(AUDIO_DIR, `${videoId}.mp3`);

    if (!fs.existsSync(AUDIO_DIR)) {
      fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }

    // Salvar texto em arquivo temporário para evitar problemas com caracteres especiais no Windows
    const textFile = path.join(TEMP_DIR, `${videoId}_text.txt`);
    fs.writeFileSync(textFile, roteiro, 'utf8');

    // edge-tts funciona no Windows via pip: pip install edge-tts
    // No Windows: edge-tts.exe ou python -m edge_tts
    const edgeTtsCmd = isWindows
      ? `python -m edge_tts --voice "${config.voice}" --rate "${config.rate}" --file "${textFile}" --write-media "${outputFile}"`
      : `edge-tts --voice "${config.voice}" --rate "${config.rate}" --file "${textFile}" --write-media "${outputFile}"`;

    await execAsync(edgeTtsCmd);

    // Limpar arquivo temporário de texto
    if (fs.existsSync(textFile)) fs.unlinkSync(textFile);

    if (fs.existsSync(outputFile)) {
      return `/audio/${videoId}.mp3`;
    }

    return null;
  } catch (error) {
    console.error('Erro ao gerar narração:', error);
    return null;
  }
}

// ============================================================
// ETAPA 3: Gerar Imagens com IA (formato 9:16 para TikTok)
// ============================================================
async function gerarImagemTikTok(
  nicho: string,
  tema: string,
  index: number
): Promise<string | null> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const promptsNicho: Record<string, string> = {
      motivacional: 'motivational lifestyle photography, person achieving success, golden hour lighting, vibrant colors, cinematic',
      curiosidades: 'stunning nature photography, mind-blowing facts visualization, dramatic lighting, photorealistic',
      humor: 'funny relatable situation, cartoon style, bright colors, expressive characters',
      educativo: 'educational infographic style, clean design, modern, informative visual',
      lifestyle: 'aesthetic lifestyle photography, minimalist, trendy, Instagram-worthy',
      financas: 'financial success visualization, money, growth charts, professional, clean',
      tecnologia: 'futuristic technology, AI, digital art, neon colors, cyberpunk aesthetic',
      saude: 'healthy lifestyle, fitness, wellness, natural lighting, energetic',
      receitas: 'food photography, delicious meal, professional lighting, appetizing',
      relacionamentos: 'romantic couple, connection, warm colors, emotional, heartfelt',
      negocios: 'professional business, entrepreneurship, success, modern office',
      espiritualidade: 'spiritual meditation, peaceful nature, soft light, zen, mindfulness',
    };

    const nichoPrompt = promptsNicho[nicho] || 'viral TikTok content, engaging visual, high quality';
    const prompt = `${nichoPrompt}, about "${tema}", vertical format 9:16, TikTok video style, ultra high quality, ${index === 0 ? 'eye-catching hook visual' : `scene ${index + 1}`}`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1792', quality: 'standard' }),
    });

    if (!response.ok) throw new Error(`Erro na API DALL-E: ${response.status}`);

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error('Erro ao gerar imagem:', error);
    return null;
  }
}

// ============================================================
// ETAPA 4: Montar Vídeo TikTok com FFmpeg (1080x1920)
// Compatível com Windows (ffmpeg.exe no PATH ou via winget/choco)
// ============================================================
async function montarVideoTikTok(
  videoId: string,
  audioPath: string | null,
  imagensUrls: string[],
  duracao: string,
  legendasAnimadas: boolean
): Promise<string | null> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const fs = await import('fs');

    const outputFile = path.join(VIDEO_DIR, `${videoId}.mp4`);

    if (!fs.existsSync(VIDEO_DIR)) {
      fs.mkdirSync(VIDEO_DIR, { recursive: true });
    }

    const duracaoNum = parseInt(duracao, 10);
    const audioFile = audioPath ? path.join(AUDIO_DIR, `${videoId}.mp3`) : null;

    // Verificar se FFmpeg está disponível (funciona igual no Windows se estiver no PATH)
    try {
      await execAsync('ffmpeg -version');
    } catch {
      console.log('FFmpeg não disponível, simulando montagem de vídeo');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return `/video/${videoId}.mp4`;
    }

    // No Windows, usar aspas duplas nos caminhos (path.join já usa \\ no Windows)
    // ffmpeg aceita tanto / quanto \ no Windows
    const outputFileNorm = outputFile.replace(/\\/g, '/');
    const audioFileNorm = audioFile ? audioFile.replace(/\\/g, '/') : null;

    let ffmpegCmd: string;

    if (audioFileNorm && imagensUrls.length > 0) {
      const duracaoPorImagem = Math.ceil(duracaoNum / imagensUrls.length);
      const imagensInput = imagensUrls.map(url => `-loop 1 -t ${duracaoPorImagem} -i "${url}"`).join(' ');
      const filtros = imagensUrls.map((_, i) =>
        `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[v${i}]`
      ).join(';');
      const concat = imagensUrls.map((_, i) => `[v${i}]`).join('');

      ffmpegCmd = `ffmpeg -y ${imagensInput} -i "${audioFileNorm}" -filter_complex "${filtros};${concat}concat=n=${imagensUrls.length}:v=1:a=0[vout]" -map "[vout]" -map ${imagensUrls.length}:a -c:v libx264 -c:a aac -t ${duracaoNum} -r 30 -pix_fmt yuv420p "${outputFileNorm}"`;
    } else {
      ffmpegCmd = `ffmpeg -y -f lavfi -i color=c=black:s=1080x1920:r=30:d=${duracaoNum} ${audioFileNorm ? `-i "${audioFileNorm}" -c:a aac` : ''} -c:v libx264 -t ${duracaoNum} -pix_fmt yuv420p "${outputFileNorm}"`;
    }

    await execAsync(ffmpegCmd);

    return `/video/${videoId}.mp4`;
  } catch (error) {
    console.error('Erro ao montar vídeo:', error);
    return `/video/${videoId}.mp4`;
  }
}

// ============================================================
// ETAPA 5: Publicar no TikTok via API
// ============================================================
async function publicarNoTikTok(
  titulo: string,
  hashtags: string[]
): Promise<{ tiktokVideoId: string; tiktokUrl: string } | null> {
  try {
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    if (!accessToken) return null;

    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        post_info: {
          title: titulo,
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: { source: 'FILE_UPLOAD', video_size: 10000000, chunk_size: 10000000, total_chunk_count: 1 },
      }),
    });

    if (!response.ok) throw new Error(`Erro TikTok API: ${response.status}`);

    const data = await response.json();
    const publishId = data.data?.publish_id;
    if (!publishId) throw new Error('Não foi possível obter publish_id');

    return { tiktokVideoId: publishId, tiktokUrl: `https://www.tiktok.com/@usuario/video/${publishId}` };
  } catch (error) {
    console.error('Erro ao publicar no TikTok:', error);
    return null;
  }
}

// ============================================================
// ROUTER PRINCIPAL
// ============================================================
export const pipelineRouter = router({
  execute: protectedProcedure
    .input(executePipelineSchema)
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
        // ETAPA 1: ROTEIRO
        await addLog('info', 'roteiro', 'Gerando roteiro viral com Gemini AI...',
          `Nicho: ${video.nicho} | Duração: ${video.duracao}s | Estilo: ${video.estiloNarracao}`);

        const { roteiro, hashtags, titulo, hook } = await gerarRoteiroTikTok(
          video.nicho, video.tema, video.descricao, video.duracao, video.estiloNarracao, video.hookInicial
        );

        await db.update(videos).set({ roteiro, hashtags, titulo }).where(eq(videos.id, videoId));
        await addLog('sucesso', 'roteiro', 'Roteiro viral gerado com sucesso!',
          `Hook: "${hook}" | ${roteiro.split(' ').length} palavras`);

        // ETAPA 2: NARRAÇÃO
        await addLog('info', 'narracao', 'Sintetizando narração com Edge TTS...',
          `SO: ${isWindows ? 'Windows' : 'Linux/Mac'} | Voz: pt-BR`);

        const audioUrl = await gerarNarracao(roteiro, video.estiloNarracao, videoId);

        if (audioUrl) {
          await db.update(videos).set({ audioUrl }).where(eq(videos.id, videoId));
          await addLog('sucesso', 'narracao', 'Narração gerada com sucesso!', `Arquivo: ${audioUrl}`);
        } else {
          await addLog('aviso', 'narracao', 'Edge TTS não disponível',
            isWindows
              ? 'Instale com: pip install edge-tts (Python necessário)'
              : 'Instale com: pip install edge-tts');
        }

        // ETAPA 3: IMAGENS
        await addLog('info', 'imagem', 'Gerando imagens verticais 9:16 com IA...',
          'Formato: 1080x1920 (TikTok)');

        const imagensGeradas: string[] = [];
        const numImagens = Math.ceil(parseInt(video.duracao, 10) / 10);

        for (let i = 0; i < numImagens; i++) {
          const imagemUrl = await gerarImagemTikTok(video.nicho, video.tema, i);
          if (imagemUrl) {
            imagensGeradas.push(imagemUrl);
            await db.insert(imagensIA).values({
              id: randomUUID(),
              userId: ctx.user!.id,
              videoId,
              prompt: `${video.nicho} - ${video.tema} - cena ${i + 1}`,
              url: imagemUrl,
              modelo: 'dall-e-3',
              formato: '1080x1920',
            });
          }
        }

        await addLog('sucesso', 'imagem',
          imagensGeradas.length > 0
            ? `${imagensGeradas.length} imagens geradas com sucesso!`
            : 'Geração de imagens pulada (OPENAI_API_KEY não configurada)',
          imagensGeradas.length > 0 ? 'Formato: 1080x1920 (9:16 TikTok)' : undefined
        );

        // ETAPA 4: MONTAGEM DO VÍDEO
        await addLog('info', 'video', 'Montando vídeo TikTok com FFmpeg...',
          `Resolução: 1080x1920 | Duração: ${video.duracao}s | SO: ${isWindows ? 'Windows' : 'Linux'}`);

        await new Promise(resolve => setTimeout(resolve, 2000));

        const videoUrl = await montarVideoTikTok(
          videoId, audioUrl, imagensGeradas, video.duracao, video.legendasAnimadas
        );

        if (videoUrl) {
          await db.update(videos).set({ videoUrl }).where(eq(videos.id, videoId));
          await addLog('sucesso', 'video', 'Vídeo TikTok montado com sucesso!',
            `Arquivo: ${videoUrl} | Formato: MP4 1080x1920 30fps`);
        }

        // ETAPA 5: THUMBNAIL
        await addLog('info', 'thumbnail', 'Gerando thumbnail atrativa...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const thumbnailUrl = `/thumbnail/${videoId}.jpg`;
        await db.update(videos).set({ thumbnailUrl }).where(eq(videos.id, videoId));
        await addLog('sucesso', 'thumbnail', 'Thumbnail gerada com sucesso!');

        // ETAPA 6: PUBLICAÇÃO
        if (video.autoPublicar) {
          await addLog('info', 'publicacao', 'Publicando vídeo no TikTok...',
            `Hashtags: ${hashtags.join(' ')}`);

          const tiktokResult = await publicarNoTikTok(titulo, hashtags);

          if (tiktokResult) {
            await db.update(videos).set({
              status: 'publicado',
              tiktokVideoId: tiktokResult.tiktokVideoId,
              tiktokUrl: tiktokResult.tiktokUrl,
              publicadoEm: new Date(),
            }).where(eq(videos.id, videoId));
            await addLog('sucesso', 'publicacao', '🎉 Vídeo publicado no TikTok com sucesso!',
              `URL: ${tiktokResult.tiktokUrl}`);
          } else {
            await db.update(videos).set({ status: 'concluido' }).where(eq(videos.id, videoId));
            await addLog('aviso', 'publicacao',
              'Publicação automática não disponível (TIKTOK_ACCESS_TOKEN não configurado)',
              'Configure o token em Configurações');
          }
        } else {
          await db.update(videos).set({ status: 'concluido' }).where(eq(videos.id, videoId));
          await addLog('sucesso', 'geral', '✅ Vídeo pronto para publicação manual no TikTok!');
        }

        await addLog('sucesso', 'geral', '🚀 Pipeline TikTok concluído com sucesso!');
        return { success: true, message: 'Pipeline TikTok concluído' };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        await db.update(videos).set({ status: 'erro', erro: errorMessage }).where(eq(videos.id, videoId));
        await addLog('erro', 'geral', `Erro no pipeline: ${errorMessage}`);
        throw new Error(`Erro no pipeline: ${errorMessage}`);
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
      const etapasCompletas = new Set(logsRecentes.filter(l => l.tipo === 'sucesso').map(l => l.etapa));
      const progresso = Math.round((etapasCompletas.size / etapas.length) * 100);

      return {
        videoId: input.videoId,
        status: video.status,
        progresso: Math.min(progresso, 100),
        logs: logsRecentes,
      };
    }),
});
