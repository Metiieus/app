import { describe, it, expect } from 'vitest';
import { appRouter } from '../src/routers';

const mockContext = {
  req: {} as any,
  res: {} as any,
  user: { id: 'test-user-id', name: 'Test User' },
};

const caller = appRouter.createCaller(mockContext);

describe('Logs Router', () => {
  it('deve criar um novo log', async () => {
    const result = await caller.logs.create({
      tipo: 'info',
      etapa: 'geral',
      mensagem: 'Teste de log',
      detalhes: 'Detalhes do teste',
    });

    expect(result.success).toBe(true);
    expect(result.logId).toBeDefined();
  });

  it('deve listar logs do usuário', async () => {
    const result = await caller.logs.list({
      tipo: 'todos',
      etapa: 'todas',
      page: 1,
      limit: 10,
    });

    expect(result.items).toBeDefined();
    expect(result.total).toBeDefined();
    expect(result.page).toBe(1);
  });

  it('deve filtrar logs por tipo', async () => {
    const result = await caller.logs.list({
      tipo: 'info',
      etapa: 'todas',
      page: 1,
      limit: 10,
    });

    expect(result.items).toBeDefined();
    // Todos os logs retornados devem ser do tipo 'info'
    result.items.forEach(log => {
      expect(log.tipo).toBe('info');
    });
  });

  it('deve exportar logs como CSV', async () => {
    const result = await caller.logs.export({
      tipo: 'todos',
      etapa: 'todas',
    });

    expect(result.csv).toBeDefined();
    expect(typeof result.csv).toBe('string');
    expect(result.csv.includes('Data,Tipo,Etapa,Mensagem,Detalhes')).toBe(true);
  });

  it('deve obter logs recentes', async () => {
    const result = await caller.logs.recent();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});
