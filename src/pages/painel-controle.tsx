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
  Zap,
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
    mensagem: 'Roteiro viral gerado para "5 hábitos que vão mudar sua vida"',
    detalhes: 'Duração: 30s, 85 palavras, nicho: Motivacional',
    criadoEm: '2026-02-24T10:05:00',
  },
  {
    id: '2',
    tipo: 'info',
    etapa: 'narracao',
    mensagem: 'Iniciando síntese de voz com Edge TTS...',
    detalhes: 'Voz: pt-BR-FranciscaNeural, estilo: Enérgico',
    criadoEm: '2026-02-24T10:06:00',
  },
  {
    id: '3',
    tipo: 'sucesso',
    etapa: 'narracao',
    mensagem: 'Narração concluída com sucesso',
    detalhes: 'Arquivo: /audio/habitos-vida.mp3 (28s)',
    criadoEm: '2026-02-24T10:07:30',
  },
  {
    id: '4',
    tipo: 'info',
    etapa: 'imagem',
    mensagem: 'Gerando imagens com IA...',
    detalhes: 'Prompt: Motivational lifestyle, cinematic, vibrant colors, 9:16 format',
    criadoEm: '2026-02-24T10:08:00',
  },
  {
    id: '5',
    tipo: 'sucesso',
    etapa: 'imagem',
    mensagem: '5 imagens geradas para o vídeo',
    detalhes: 'Formato: 1080x1920 (9:16 TikTok)',
    criadoEm: '2026-02-24T10:09:30',
  },
  {
    id: '6',
    tipo: 'info',
    etapa: 'video',
    mensagem: 'Montando vídeo TikTok com FFmpeg...',
    detalhes: 'Resolução: 1080x1920, 30fps, legendas animadas ativadas',
    criadoEm: '2026-02-24T10:10:00',
  },
  {
    id: '7',
    tipo: 'sucesso',
    etapa: 'video',
    mensagem: 'Vídeo montado com sucesso',
    detalhes: 'Duração: 30s, tamanho: 8.2MB',
    criadoEm: '2026-02-24T10:12:00',
  },
  {
    id: '8',
    tipo: 'info',
    etapa: 'publicacao',
    mensagem: 'Publicando no TikTok via API...',
    detalhes: 'Hashtags: #motivacao #habitos #produtividade',
    criadoEm: '2026-02-24T10:12:30',
  },
  {
    id: '9',
    tipo: 'sucesso',
    etapa: 'publicacao',
    mensagem: '🎉 Vídeo publicado no TikTok com sucesso!',
    detalhes: 'URL: https://tiktok.com/@usuario/video/123456',
    criadoEm: '2026-02-24T10:13:00',
  },
  {
    id: '10',
    tipo: 'aviso',
    etapa: 'geral',
    mensagem: 'Rate limit da API TikTok atingido, aguardando 60s...',
    detalhes: 'Próxima tentativa em 60 segundos',
    criadoEm: '2026-02-24T10:14:00',
  },
];

const tipoIcons: Record<string, React.ElementType> = {
  sucesso: CheckCircle,
  info: Info,
  erro: XCircle,
  aviso: AlertTriangle,
};

const tipoColors: Record<string, string> = {
  sucesso: 'text-green-700 bg-green-50 border border-green-100',
  info: 'text-blue-700 bg-blue-50 border border-blue-100',
  erro: 'text-red-700 bg-red-50 border border-red-100',
  aviso: 'text-yellow-700 bg-yellow-50 border border-yellow-100',
};

const etapaLabels: Record<string, string> = {
  roteiro: '📝 Roteiro',
  narracao: '🎙️ Narração',
  imagem: '🎨 Imagens',
  video: '🎬 Vídeo',
  thumbnail: '🖼️ Thumbnail',
  publicacao: '📱 TikTok',
  geral: '⚙️ Sistema',
};

export function PainelControlePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [etapaFilter, setEtapaFilter] = useState('todas');
  const [schedulerAtivo, setSchedulerAtivo] = useState(true);
  const [logs] = useState(mockLogs);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setUltimaAtualizacao(new Date());
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
        [log.criadoEm, log.tipo, log.etapa, log.mensagem, log.detalhes || '']
          .map((cell) => `"${cell.replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tiktok-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({ title: '📥 Logs exportados', description: 'Arquivo CSV baixado com sucesso.' });
  };

  const toggleScheduler = () => {
    setSchedulerAtivo(!schedulerAtivo);
    toast({
      title: schedulerAtivo ? '⏸️ Máquina pausada' : '▶️ Máquina ativada',
      description: `A máquina de vídeos foi ${schedulerAtivo ? 'pausada' : 'ativada'}.`,
    });
  };

  const sucessos = logs.filter((l) => l.tipo === 'sucesso').length;
  const erros = logs.filter((l) => l.tipo === 'erro').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Painel de Controle</h1>
            <p className="text-gray-500 text-sm">
              Monitore a máquina de vídeos em tempo real
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExport} className="rounded-xl border-gray-200">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Máquina de Vídeos</CardTitle>
            <Activity className={`h-4 w-4 ${schedulerAtivo ? 'text-green-500' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-2.5 w-2.5 rounded-full ${schedulerAtivo ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="font-bold text-gray-900">{schedulerAtivo ? 'Rodando' : 'Pausada'}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-xs h-7 px-2"
              onClick={toggleScheduler}
            >
              {schedulerAtivo ? (
                <><Pause className="mr-1 h-3 w-3" /> Pausar</>
              ) : (
                <><Play className="mr-1 h-3 w-3" /> Ativar</>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Total de Logs</CardTitle>
            <Zap className="h-4 w-4 text-[#ff0050]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{logs.length}</div>
            <p className="text-xs text-gray-500 mt-1">Últimas 24h</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Sucessos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{sucessos}</div>
            <p className="text-xs text-gray-500 mt-1">Operações concluídas</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-rose-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Erros</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{erros}</div>
            <p className="text-xs text-gray-500 mt-1">Requerem atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[160px] rounded-xl border-gray-200">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="info">ℹ️ Info</SelectItem>
            <SelectItem value="sucesso">✅ Sucesso</SelectItem>
            <SelectItem value="erro">❌ Erro</SelectItem>
            <SelectItem value="aviso">⚠️ Aviso</SelectItem>
          </SelectContent>
        </Select>

        <Select value={etapaFilter} onValueChange={setEtapaFilter}>
          <SelectTrigger className="w-[180px] rounded-xl border-gray-200">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as etapas</SelectItem>
            <SelectItem value="roteiro">📝 Roteiro</SelectItem>
            <SelectItem value="narracao">🎙️ Narração</SelectItem>
            <SelectItem value="imagem">🎨 Imagens</SelectItem>
            <SelectItem value="video">🎬 Vídeo</SelectItem>
            <SelectItem value="thumbnail">🖼️ Thumbnail</SelectItem>
            <SelectItem value="publicacao">📱 TikTok</SelectItem>
            <SelectItem value="geral">⚙️ Sistema</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => { setTipoFilter('todos'); setEtapaFilter('todas'); }}
          className="rounded-xl border-gray-200"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Limpar
        </Button>

        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          Atualizado às {ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* Logs */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">Logs em Tempo Real</CardTitle>
            <Badge variant="secondary" className="text-xs">{filteredLogs.length} registros</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px] px-4 pb-4">
            <div className="space-y-2 pt-2">
              {filteredLogs.map((log) => {
                const Icon = tipoIcons[log.tipo];
                return (
                  <div key={log.id} className={`rounded-xl p-3.5 ${tipoColors[log.tipo]}`}>
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs rounded-full bg-white/60 border-0">
                            {etapaLabels[log.etapa]}
                          </Badge>
                          <span className="text-xs opacity-60">
                            {new Date(log.criadoEm).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                        <p className="mt-1 font-semibold text-sm">{log.mensagem}</p>
                        {log.detalhes && (
                          <p className="mt-0.5 text-xs opacity-70">{log.detalhes}</p>
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
