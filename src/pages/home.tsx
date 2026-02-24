import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, TrendingUp, Video, CheckCircle, AlertCircle, Loader2, RefreshCw, Clock, Monitor, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API = 'http://localhost:3001';
const HEADERS = { 'x-user-id': 'dev-user-001' };

interface Stats {
  total: number;
  publicados: number;
  concluidos: number;
  comErro: number;
  totalViews: number;
  totalLikes: number;
  videosPorDia: { data: string; count: number }[];
}

interface VideoItem {
  id: string;
  titulo: string;
  nicho: string;
  status: string;
  criadoEm: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duracao: string;
}

const nichoEmoji: Record<string, string> = {
  motivacional: '💪', curiosidades: '🤯', humor: '😂', educativo: '📚',
  lifestyle: '✨', financas: '💰', tecnologia: '🤖', saude: '🏃',
  receitas: '🍕', relacionamentos: '❤️', negocios: '📈', espiritualidade: '🧘',
};

const statusConfig: Record<string, { color: string; label: string }> = {
  pendente: { color: 'bg-gray-100 text-gray-600', label: 'Pendente' },
  processando: { color: 'bg-blue-100 text-blue-700', label: 'Processando' },
  concluido: { color: 'bg-green-100 text-green-700', label: 'Concluído' },
  publicado: { color: 'bg-[#ff0050]/10 text-[#ff0050]', label: 'Publicado' },
  erro: { color: 'bg-red-100 text-red-700', label: 'Erro' },
};

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

const quickActions = [
  { name: 'Criar Vídeo', description: 'Gerar novo conteúdo viral', icon: Wand2, href: '/criar', gradient: 'from-[#ff0050] to-[#ff4d7d]' },
  { name: 'Agendador', description: 'Postar no horário certo', icon: Clock, href: '/agendador', gradient: 'from-[#7c3aed] to-[#a855f7]' },
  { name: 'Histórico', description: 'Ver vídeos criados', icon: Play, href: '/historico', gradient: 'from-[#059669] to-[#10b981]' },
  { name: 'Painel de Controle', description: 'Monitorar processos', icon: Monitor, href: '/painel', gradient: 'from-[#d97706] to-[#f59e0b]' },
];

export function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentVideos, setRecentVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, videosRes] = await Promise.all([
        fetch(`${API}/api/videos/stats`, { headers: HEADERS }),
        fetch(`${API}/api/videos`, { headers: HEADERS }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (videosRes.ok) {
        const data = await videosRes.json();
        setRecentVideos((data.items || []).slice(0, 5));
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const hasProcessing = recentVideos.some(v => v.status === 'processando' || v.status === 'pendente');
    if (!hasProcessing) return;
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [recentVideos]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
          <p className="mt-1 text-gray-500">Sua máquina de vídeos TikTok 🚀</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="rounded-xl" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => navigate('/criar')}
            className="bg-gradient-to-r from-[#ff0050] to-[#ff4d7d] hover:opacity-90 text-white font-bold shadow-lg shadow-[#ff0050]/20 rounded-xl"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Criar Agora
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff0050]" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Video className="h-4 w-4 text-[#ff0050]" />, label: 'Total de Vídeos', value: stats?.total ?? 0, bg: 'bg-[#ff0050]/10' },
              { icon: <CheckCircle className="h-4 w-4 text-green-600" />, label: 'Prontos', value: (stats?.concluidos ?? 0) + (stats?.publicados ?? 0), bg: 'bg-green-100' },
              { icon: <TrendingUp className="h-4 w-4 text-blue-600" />, label: 'Total Views', value: formatNum(stats?.totalViews ?? 0), bg: 'bg-blue-100' },
              { icon: <AlertCircle className="h-4 w-4 text-red-500" />, label: 'Com Erro', value: stats?.comErro ?? 0, bg: 'bg-red-100' },
            ].map((s, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>{s.icon}</div>
                    <div>
                      <p className="text-xs text-gray-500">{s.label}</p>
                      <p className="text-2xl font-black text-gray-900">{s.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-gray-900">Ações Rápidas</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.name}
                    className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                    onClick={() => navigate(action.href)}
                  >
                    <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="font-bold text-gray-900">{action.name}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{action.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vídeos Recentes */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Vídeos Recentes</CardTitle>
                <Button variant="ghost" size="sm" className="text-[#ff0050] text-xs" onClick={() => navigate('/historico')}>
                  Ver todos →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <p className="text-4xl mb-3">🎬</p>
                  <p className="font-semibold text-gray-600">Nenhum vídeo ainda</p>
                  <p className="text-sm mt-1">Crie seu primeiro vídeo TikTok agora!</p>
                  <Button onClick={() => navigate('/criar')} className="mt-4 bg-gradient-to-r from-[#ff0050] to-[#ff4d7d] text-white rounded-xl">
                    <Wand2 className="mr-2 h-4 w-4" /> Criar Vídeo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentVideos.map((video) => {
                    const sc = statusConfig[video.status] || statusConfig.pendente;
                    return (
                      <div key={video.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                        <div className="h-12 w-8 rounded-lg overflow-hidden bg-gradient-to-br from-[#ff0050]/20 to-[#00f2ea]/20 flex-shrink-0 flex items-center justify-center text-lg">
                          {video.thumbnailUrl ? (
                            <img src={`${API}${video.thumbnailUrl}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            nichoEmoji[video.nicho] || '📹'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{video.titulo}</p>
                          <p className="text-xs text-gray-400">{video.duracao}s · {new Date(video.criadoEm).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {video.status === 'processando' && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />}
                          <Badge className={`${sc.color} border-0 text-xs`}>{sc.label}</Badge>
                          {video.videoUrl && (
                            <a href={`${API}/download/${video.videoUrl.split('/').pop()}`} download className="text-[#ff0050] hover:opacity-70 text-sm" title="Baixar">⬇️</a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico simples de produção */}
          {stats && stats.videosPorDia && stats.videosPorDia.some(d => d.count > 0) && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Produção — Últimos 7 dias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-24">
                  {stats.videosPorDia.map((d) => {
                    const max = Math.max(...stats.videosPorDia.map(x => x.count), 1);
                    const height = Math.max((d.count / max) * 100, d.count > 0 ? 10 : 0);
                    return (
                      <div key={d.data} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-gray-700">{d.count > 0 ? d.count : ''}</span>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-[#ff0050] to-[#ff4d7d] transition-all"
                          style={{ height: `${height}%`, minHeight: d.count > 0 ? '8px' : '2px', opacity: d.count > 0 ? 1 : 0.2 }}
                        />
                        <span className="text-xs text-gray-400">{new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
