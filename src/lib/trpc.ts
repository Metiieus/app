// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppRouter = any;

// Simulação do tRPC para build estático
export const trpc = {
  createClient: () => ({}),
  Provider: ({ children }: { children: React.ReactNode }) => children,
};

export type RouterOutput = {
  videos: {
    list: {
      items: {
        id: string;
        titulo: string;
        tema: string;
        status: string;
        criadoEm: Date;
      }[];
      total: number;
      page: number;
      totalPages: number;
    };
    get: {
      id: string;
      titulo: string;
      tema: string;
      descricao: string;
      status: string;
      roteiro: string | null;
      hashtags: string[];
      audioUrl: string | null;
      videoUrl: string | null;
      thumbnailUrl: string | null;
      youtubeUrl: string | null;
      erro: string | null;
      criadoEm: Date;
      publicadoEm: Date | null;
    };
    stats: {
      total: number;
      publicados: number;
      comErro: number;
      taxaSucesso: number;
      videosPorDia: { data: string; count: number }[];
    };
  };
  agendamentos: {
    list: {
      id: string;
      tema: string;
      descricao: string;
      tipo: string;
      proximaExecucao: Date;
      ultimaExecucao: Date | null;
      ativo: boolean;
      criadoEm: Date;
    }[];
  };
  logs: {
    list: {
      items: {
        id: string;
        tipo: string;
        etapa: string;
        mensagem: string;
        detalhes: string | null;
        criadoEm: Date;
      }[];
      total: number;
      page: number;
      totalPages: number;
    };
    export: {
      csv: string;
    };
    recent: {
      id: string;
      tipo: string;
      etapa: string;
      mensagem: string;
      detalhes: string | null;
      criadoEm: Date;
    }[];
  };
  configuracoes: {
    list: {
      id: string;
      chave: string;
      valor: string;
      valorMascarado: string;
      criadoEm: Date;
    }[];
    get: {
      id: string;
      chave: string;
      valor: string;
      valorMascarado: string;
      criadoEm: Date;
    } | null;
  };
  pipeline: {
    status: {
      videoId: string;
      status: string;
      etapaAtual: string;
      progresso: number;
      logs: {
        id: string;
        tipo: string;
        etapa: string;
        mensagem: string;
        criadoEm: Date;
      }[];
    };
  };
};
