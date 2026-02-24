import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Play,
  Pause,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

// Dados mockados
const mockLogs = [
  {
    id: '1',
    tipo: 'sucesso',
    etapa: 'roteiro',
    mensagem: 'Roteiro gerado com sucesso para Charizard',
    detalhes: 'Duração: 60s, 150 palavras',
    criadoEm: '2024-01-26T10:05:00',
  },
  {
    id: '2',
    tipo: 'info',
    etapa: 'narracao',
    mensagem: 'Iniciando síntese de voz...',
    detalhes: null,
    criadoEm: '2024-01-26T10:06:00',
  },
  {
    id: '3',
    tipo: 'sucesso',
    etapa: 'narracao',
    mensagem: 'Narração concluída',
    detalhes: 'Arquivo: /audio/charizard.mp3',
    criadoEm: '2024-01-26T10:07:30',
  },
  {
    id: '4',
    tipo: 'info',
    etapa: 'imagem',
    mensagem: 'Gerando imagens com DALL-E...',
    detalhes: 'Prompt: Epic Charizard scene, cinematic lighting',
    criadoEm: '2024-01-26T10:08:00',
  },
  {
    id: '5',
    tipo: 'aviso',
    etapa: 'imagem',
    mensagem: 'API DALL-E não configurada, usando imagens padrão',
    detalhes: null,
    criadoEm: '2024-01-26T10:08:15',
  },
  {
    id: '6',
    tipo: 'erro',
    etapa: 'video',
    mensagem: 'Erro ao processar vídeo: FFmpeg não encontrado',
    detalhes: 'Instale FFmpeg: apt-get install ffmpeg',
    criadoEm: '2024-01-26T10:10:00',
  },
];

const tipoIcons: Record<string, React.ElementType> = {
  sucesso: CheckCircle,
  info: Info,
  erro: XCircle,
  aviso: AlertTriangle,
};

const tipoColors: Record<string, string> = {
  sucesso: 'text-green-600 bg-green-50',
  info: 'text-blue-600 bg-blue-50',
  erro: 'text-red-600 bg-red-50',
  aviso: 'text-yellow-600 bg-yellow-50',
};

const etapaLabels: Record<string, string> = {
  roteiro: 'Roteiro',
  narracao: 'Narração',
  imagem: 'Imagens',
  video: 'Vídeo',
  thumbnail: 'Thumbnail',
  publicacao: 'Publicação',
  geral: 'Geral',
};

export function PainelControlePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [etapaFilter, setEtapaFilter] = useState('todas');
  const [schedulerAtivo, setSchedulerAtivo] = useState(true);
  const [logs] = useState(mockLogs);

  // Simular atualização em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      // Aqui seria feita a chamada real à API
      // setLogs([...]); 
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesTipo = tipoFilter === 'todos' || log.tipo === tipoFilter;
    const matchesEtapa = etapaFilter === 'todas' || log.etapa === etapaFilter;
    return matchesTipo && matchesEtapa;
  });

  const handleExport = () => {
    const csv = [
      ['Data', 'Tipo', 'Etapa', 'Mensagem', 'Detalhes'].join(','),
      ...filteredLogs.map((log) =>
        [
          log.criadoEm,
          log.tipo,
          log.etapa,
          log.mensagem,
          log.detalhes || '',
        ]
          .map((cell) => `"${cell.replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: 'Logs exportados',
      description: 'O arquivo CSV foi baixado com sucesso.',
    });
  };

  const toggleScheduler = () => {
    setSchedulerAtivo(!schedulerAtivo);
    toast({
      title: schedulerAtivo ? 'Scheduler pausado' : 'Scheduler ativado',
      description: `O scheduler foi ${schedulerAtivo ? 'pausado' : 'ativado'}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Painel de Controle
            </h1>
            <p className="text-gray-500">Monitore logs e status do sistema</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Status do Scheduler
            </CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  schedulerAtivo ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="font-medium text-gray-900">
                {schedulerAtivo ? 'Ativo' : 'Pausado'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={toggleScheduler}
            >
              {schedulerAtivo ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Ativar
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Logs
            </CardTitle>
            <Info className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
            <p className="text-xs text-gray-500">Últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sucessos
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {logs.filter((l) => l.tipo === 'sucesso').length}
            </div>
            <p className="text-xs text-gray-500">Operações concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Erros
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {logs.filter((l) => l.tipo === 'erro').length}
            </div>
            <p className="text-xs text-gray-500">Requerem atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="sucesso">Sucesso</SelectItem>
            <SelectItem value="erro">Erro</SelectItem>
            <SelectItem value="aviso">Aviso</SelectItem>
          </SelectContent>
        </Select>

        <Select value={etapaFilter} onValueChange={setEtapaFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as etapas</SelectItem>
            <SelectItem value="roteiro">Roteiro</SelectItem>
            <SelectItem value="narracao">Narração</SelectItem>
            <SelectItem value="imagem">Imagens</SelectItem>
            <SelectItem value="video">Vídeo</SelectItem>
            <SelectItem value="thumbnail">Thumbnail</SelectItem>
            <SelectItem value="publicacao">Publicação</SelectItem>
            <SelectItem value="geral">Geral</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => {
            setTipoFilter('todos');
            setEtapaFilter('todas');
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Limpar Filtros
        </Button>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs em Tempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filteredLogs.map((log) => {
                const Icon = tipoIcons[log.tipo];
                return (
                  <div
                    key={log.id}
                    className={`rounded-lg p-4 ${tipoColors[log.tipo]}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {etapaLabels[log.etapa]}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(log.criadoEm).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="mt-1 font-medium">{log.mensagem}</p>
                        {log.detalhes && (
                          <p className="mt-1 text-sm opacity-80">{log.detalhes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
