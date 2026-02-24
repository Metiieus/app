import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../src/routers';

// Mock do contexto
const mockContext = {
  req: {} as any,
  res: {} as any,
  user: { id: 'test-user-id', name: 'Test User' },
};

// Criar caller do tRPC
const caller = appRouter.createCaller(mockContext);

describe('Videos Router', () => {
  let createdVideoId: string;

  it('deve criar um novo vídeo', async () => {
    const result = await caller.videos.create({
      titulo: 'Teste - Charizard',
      tema: 'Charizard',
      descricao: 'Vídeo de teste sobre Charizard',
      usarIA: false,
      legendas: true,
      efeitos: false,
    });

    expect(result.success).toBe(true);
    expect(result.videoId).toBeDefined();
    createdVideoId = result.videoId;
  });

  it('deve listar vídeos do usuário', async () => {
    const result = await caller.videos.list({
      status: 'todos',
      page: 1,
      limit: 10,
    });

    expect(result.items).toBeDefined();
    expect(result.total).toBeDefined();
    expect(result.page).toBe(1);
  });

  it('deve obter detalhes de um vídeo', async () => {
    const result = await caller.videos.get({ id: createdVideoId });

    expect(result.id).toBe(createdVideoId);
    expect(result.titulo).toBe('Teste - Charizard');
    expect(result.status).toBe('pendente');
  });

  it('deve atualizar um vídeo', async () => {
    const result = await caller.videos.update({
      id: createdVideoId,
      titulo: 'Teste - Charizard Atualizado',
      status: 'processando',
    });

    expect(result.success).toBe(true);

    // Verificar se foi atualizado
    const video = await caller.videos.get({ id: createdVideoId });
    expect(video.titulo).toBe('Teste - Charizard Atualizado');
    expect(video.status).toBe('processando');
  });

  it('deve obter estatísticas do dashboard', async () => {
    const result = await caller.videos.stats();

    expect(result.total).toBeDefined();
    expect(result.publicados).toBeDefined();
    expect(result.comErro).toBeDefined();
    expect(result.taxaSucesso).toBeDefined();
    expect(result.videosPorDia).toBeDefined();
    expect(result.videosPorDia.length).toBe(7);
  });

  it('deve deletar um vídeo', async () => {
    const result = await caller.videos.delete({ id: createdVideoId });
    expect(result.success).toBe(true);
  });
});
