import { describe, it, expect } from 'vitest';
import { appRouter } from '../src/routers';

const mockContext = {
  req: {} as any,
  res: {} as any,
  user: { id: 'test-user-id', name: 'Test User' },
};

const caller = appRouter.createCaller(mockContext);

describe('Configuracoes Router', () => {
  it('deve salvar uma configuração', async () => {
    const result = await caller.configuracoes.set({
      chave: 'GEMINI_API_KEY',
      valor: 'test-api-key-12345',
    });

    expect(result.success).toBe(true);
  });

  it('deve obter uma configuração', async () => {
    const result = await caller.configuracoes.get({
      chave: 'GEMINI_API_KEY',
    });

    expect(result).toBeDefined();
    if (result) {
      expect(result.chave).toBe('GEMINI_API_KEY');
      expect(result.valorMascarado).toBeDefined();
    }
  });

  it('deve listar todas as configurações', async () => {
    const result = await caller.configuracoes.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('deve atualizar uma configuração existente', async () => {
    const result = await caller.configuracoes.set({
      chave: 'GEMINI_API_KEY',
      valor: 'updated-api-key-67890',
    });

    expect(result.success).toBe(true);

    // Verificar se foi atualizado
    const config = await caller.configuracoes.get({ chave: 'GEMINI_API_KEY' });
    expect(config).toBeDefined();
    if (config) {
      expect(config.valor).toBe('updated-api-key-67890');
    }
  });

  it('deve deletar uma configuração', async () => {
    const result = await caller.configuracoes.delete({
      chave: 'GEMINI_API_KEY',
    });

    expect(result.success).toBe(true);
  });
});
