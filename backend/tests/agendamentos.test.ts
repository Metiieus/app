import { describe, it, expect } from 'vitest';
import { appRouter } from '../src/routers';

const mockContext = {
  req: {} as any,
  res: {} as any,
  user: { id: 'test-user-id', name: 'Test User' },
};

const caller = appRouter.createCaller(mockContext);

describe('Agendamentos Router', () => {
  let createdAgendamentoId: string;

  it('deve criar um novo agendamento', async () => {
    const proximaExecucao = new Date();
    proximaExecucao.setDate(proximaExecucao.getDate() + 1);

    const result = await caller.agendamentos.create({
      tema: 'Dragonite',
      descricao: 'Vídeo sobre Dragonite',
      tipo: 'semanal',
      proximaExecucao,
    });

    expect(result.success).toBe(true);
    expect(result.agendamentoId).toBeDefined();
    createdAgendamentoId = result.agendamentoId;
  });

  it('deve listar agendamentos do usuário', async () => {
    const result = await caller.agendamentos.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('deve atualizar um agendamento', async () => {
    const result = await caller.agendamentos.update({
      id: createdAgendamentoId,
      tema: 'Dragonite Atualizado',
      ativo: false,
    });

    expect(result.success).toBe(true);
  });

  it('deve pausar/ativar um agendamento', async () => {
    const result = await caller.agendamentos.toggle({ id: createdAgendamentoId });

    expect(result.success).toBe(true);
    expect(typeof result.ativo).toBe('boolean');
  });

  it('deve deletar um agendamento', async () => {
    const result = await caller.agendamentos.delete({ id: createdAgendamentoId });
    expect(result.success).toBe(true);
  });
});
