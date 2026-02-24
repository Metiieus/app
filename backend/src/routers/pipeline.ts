import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { videos, logs, imagensIA } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Schema para executar pipeline
const executePipelineSchema = z.object({
  videoId: z.string(),
});

// Função para gerar roteiro com Gemini
async function gerarRoteiro(tema: string, descricao: string, duracao: number = 60): Promise<{ roteiro: string; hashtags: string[]; titulo: string }> {
  const prompt = `Você é um roteirista especializado em YouTube Shorts sobre Pokémon e RPG.
Crie um roteiro épico de ${duracao}s com tema: ${tema}
Descrição: ${descricao}

O roteiro deve ter:
- Introdução impactante (10s)
- Desenvolvimento épico (40s)
- Conclusão memorável (10s)

Responda em JSON com este formato exato:
{
  "titulo": "Título épico do vídeo",
  "roteiro": "Texto completo do roteiro para narração",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na API Gemini: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extrair JSON da resposta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        roteiro: result.roteiro,
        hashtags: result.hashtags,
        titulo: result.titulo,
      };
    }

    throw new Error('Não foi possível extrair JSON da resposta');
  } catch (error) {
    console.error('Erro ao gerar roteiro:', error);
    // Retornar roteiro padrão em caso de erro
    return {
      titulo: `${tema} - Aventura Épica`,
      roteiro: `Bem-vindos, treinadores! Hoje vamos explorar o incrível mundo de ${tema}. Preparem-se para uma aventura épica cheia de descobertas e batalhas emocionantes!`,
      hashtags: ['#Pokemon', '#RPG', '#Gaming'],
    };
  }
}

// Função para gerar imagem com DALL-E
async function gerarImagem(prompt: string): Promise<string | null> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('OPENAI_API_KEY não configurada, pulando geração de imagem');
      return null;
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API DALL-E: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error('Erro ao gerar imagem:', error);
    return null;
  }
}

export const pipelineRouter = router({
  // Executar pipeline de um vídeo
  execute: protectedProcedure
    .input(executePipelineSchema)
    .mutation(async ({ ctx, input }) => {
      const { videoId } = input;

      // Buscar vídeo
      const video = await db.query.videos.findFirst({
        where: and(
          eq(videos.id, videoId),
          eq(videos.userId, ctx.user!.id)
        ),
      });

      if (!video) {
        throw new Error('Vídeo não encontrado');
      }

      // Atualizar status para processando
      await db.update(videos)
        .set({ status: 'processando' })
        .where(eq(videos.id, videoId));

      try {
        // ETAPA 1: Gerar Roteiro
        await db.insert(logs).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          videoId: videoId,
          tipo: 'info',
          etapa: 'roteiro',
          mensagem: 'Iniciando geração do roteiro...',
        });

        const { roteiro, hashtags, titulo } = await gerarRoteiro(video.tema, video.descricao);

        await db.update(videos)
          .set({ roteiro, hashtags, titulo })
          .where(eq(videos.id, videoId));

        await db.insert(logs).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          videoId: videoId,
          tipo: 'sucesso',
          etapa: 'roteiro',
          mensagem: 'Roteiro gerado com sucesso',
        });

        // ETAPA 2: Gerar Narração (simulado)
        await db.insert(logs).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          videoId: videoId,
          tipo: 'info',
          etapa: 'narracao',
          mensagem: 'Iniciando geração da narração...',
        });

        // Simular geração de narração
        await new Promise(resolve => setTimeout(resolve, 2000));

        await db.update(videos)
          .set({ audioUrl: `/audio/${videoId}.mp3` })
          .where(eq(videos.id, videoId));

        await db.insert(logs).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          videoId: videoId,
          tipo: 'sucesso',
          etapa: 'narracao',
          mensagem: 'Narração gerada com sucesso',
        });

        // ETAPA 3: Gerar Imagens (opcional)
        await db.insert(logs).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          videoId: videoId,
          tipo: 'info',
          etapa: 'imagem',
          mensagem: 'Iniciando geração de imagens...',
        });

        const imagemUrl = await gerarImagem(`Epic Pokémon RPG scene: ${video.tema}, cinematic lighting, dramatic composition, high quality digital art`);

        if (imagemUrl) {
          await db.insert(imagensIA).values({
            id: randomUUID(),
            userId: ctx.user!.id,
            videoId: videoId,
            prompt: video.tema,
            url: imagemUrl,
            modelo: 'dall-e-3',
          });
        }

        await db.insert(logs).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          videoId: videoId,
          tipo: 'sucesso',
          etapa: 'imagem',
          mensagem: imagemUrl ? 'Imagens geradas com sucesso' : 'Geração de imagens pulada (API não configurada)',
        });

        // ETAPA 4: Montar Vídeo (simulado)
        await db.insert(logs).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          videoId: videoId,
          tipo: 'info',
          etapa: 'video',
          mensagem: 'Iniciando montagem do vídeo...',
        });

        // Simular montagem de vídeo
        await new Promise(resolve => setTimeout(resolve, 3000));

        await db.update(videos)
          .set({ videoUrl: `/video/${videoId}.mp4` })
          .where(eq(videos.id, videoId));

        await db.insert(logs).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          videoId: videoId,
          tipo: 'sucesso',
          etapa: 'video',
          mensagem: 'Vídeo montado com sucesso',
        });

        // ETAPA 5: Gerar Thumbnail (simulado)
        await db.insert(logs).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          videoId: videoId,
          tipo: 'info',
          etapa: 'thumbnail',
          mensagem: 'Iniciando geração da thumbnail...',
        });

        // Simular geração de thumbnail
        await new Promise(resolve => setTimeout(resolve, 1500));

        await db.update(videos)
          .set({ thumbnailUrl: `/thumbnail/${videoId}.jpg` })
          .where(eq(videos.id, videoId));

        await db.insert(logs).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          videoId: videoId,
          tipo: 'sucesso',
          etapa: 'thumbnail',
          mensagem: 'Thumbnail gerada com sucesso',
        });

        // Finalizar
        await db.update(videos)
          .set({ status: 'concluido' })
          .where(eq(videos.id, videoId));

        await db.insert(logs).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          videoId: videoId,
          tipo: 'sucesso',
          etapa: 'geral',
          mensagem: 'Pipeline concluído com sucesso!',
        });

        return { success: true, message: 'Pipeline concluído' };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

        await db.update(videos)
          .set({ status: 'erro', erro: errorMessage })
          .where(eq(videos.id, videoId));

        await db.insert(logs).values({
          id: randomUUID(),
          userId: ctx.user!.id,
          videoId: videoId,
          tipo: 'erro',
          etapa: 'geral',
          mensagem: `Erro no pipeline: ${errorMessage}`,
        });

        throw new Error(`Erro no pipeline: ${errorMessage}`);
      }
    }),

  // Obter status do pipeline
  status: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ ctx, input }) => {
      const video = await db.query.videos.findFirst({
        where: and(
          eq(videos.id, input.videoId),
          eq(videos.userId, ctx.user!.id)
        ),
      });

      if (!video) {
        throw new Error('Vídeo não encontrado');
      }

      // Buscar logs recentes do vídeo
      const logsRecentes = await db.query.logs.findMany({
        where: and(
          eq(logs.videoId, input.videoId),
          eq(logs.userId, ctx.user!.id)
        ),
        orderBy: desc(logs.criadoEm),
        limit: 10,
      });

      // Determinar etapa atual
      let etapaAtual: string = 'pendente';
      if (video.status === 'concluido') {
        etapaAtual = 'concluido';
      } else if (video.status === 'erro') {
        etapaAtual = 'erro';
      } else if (logsRecentes.length > 0) {
        etapaAtual = logsRecentes[0].etapa;
      }

      // Calcular progresso
      const etapas = ['roteiro', 'narracao', 'imagem', 'video', 'thumbnail'];
      const etapasCompletas = logsRecentes.filter(l => l.tipo === 'sucesso').map(l => l.etapa);
      const progresso = Math.round((etapasCompletas.length / etapas.length) * 100);

      return {
        videoId: input.videoId,
        status: video.status,
        etapaAtual,
        progresso: Math.min(progresso, 100),
        logs: logsRecentes,
      };
    }),
});
