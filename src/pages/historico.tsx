import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Eye, RefreshCw, Trash2, TrendingUp, Heart, Download, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const API = 'http://localhost:3001';
const HEADERS = { 'x-user-id': 'dev-user-001' };

const statusConfig: Record<string, { color: string; label: string; dot: string }> = {
  pendente: { color: 'bg-gray-100 text-gray-700', label: 'Pendente', dot: 'bg-gray-400' },
  processando: { color: 'bg-blue-100 text-blue-700', label: 'Processando', dot: 'bg-blue-500 animate-pulse' },
  concluido: { color: 'bg-green-100 text-green-700', label: 'Concluído', dot: 'bg-green-500' },
  publicado: { color: 'bg-[#ff0050]/10 text-[#ff0050]', label: 'Publicado', dot: 'bg-[#ff0050]' },
  erro: { color: 'bg-red-100 text-red-700', label: 'Erro', dot: 'bg-red-500' },
};

const nichoEmoji: Record<string, string> = {
  motivacional: '💪', curiosidades: '🤯', humor: '😂', educativo: '📚',
  lifestyle: '✨', financas: '💰', tecnologia: '🤖', saude: '🏃',
  receitas: '🍕', relacionamentos: '❤️', negocios: '📈', espiritualidade: '🧘',
};

function formatViews(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

interface Video {
  id: string;
  titulo: string;
  nicho: string;
  tema: string;
  status: string;
  criadoEm: string;
  roteiro?: string;
  hashtags?: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  tiktokUrl?: string;
  tiktokViews?: number;
  tiktokLikes?: number;
  duracao: string;
  erro?: string;
}

export function HistoricoPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const fetchVideos = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'todos') params.set('status', statusFilter);
      if (searchTerm) params.set('busca', searchTerm);
      const res = await fetch(`${API}/api/videos?${params}`, { headers: HEADERS });
      const data = await res.json();
      setVideos(data.items || []);
    } catch (e) {
      toast({ title: 'Erro ao carregar vídeos', description: String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVideos(); }, [statusFilter]);

  // Auto-refresh para vídeos processando
  useEffect(() => {
    const hasProcessing = videos.some(v => v.status === 'processando' || v.status === 'pendente');
    if (!hasProcessing) return;
    const interval = setInterval(fetchVideos, 3000);
    return () => clearInterval(interval);
  }, [videos]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API}/api/videos/${id}`, { method: 'DELETE', headers: HEADERS });
      setVideos(prev => prev.filter(v => v.id !== id));
      toast({ title: 'Vídeo deletado' });
    } catch (e) {
      toast({ title: 'Erro ao deletar', variant: 'destructive' });
    }
  };

  const totalViews = videos.reduce((acc, v) => acc + (v.tiktokViews || 0), 0);
  const totalLikes = videos.reduce((acc, v) => acc + (v.tiktokLikes || 0), 0);
  const publicados = videos.filter(v => v.status === 'publicado').length;
  const concluidos = videos.filter(v => v.status === 'concluido').length;

  const filteredVideos = videos.filter(v =>
    v.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Histórico de Vídeos</h1>
          <p className="text-gray-500 text-sm">Gerencie todos os seus vídeos TikTok</p>
        </div>
        <Button onClick={fetchVideos} variant="outline" size="icon" className="rounded-xl">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => navigate('/criar')}
          className="bg-gradient-to-r from-[#ff0050] to-[#ff4d7d] hover:opacity-90 text-white font-bold rounded-xl"
        >
          + Novo Vídeo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: <TrendingUp className="h-4 w-4 text-[#ff0050]" />, label: 'Total', value: videos.length, bg: 'bg-[#ff0050]/10' },
          { icon: <TrendingUp className="h-4 w-4 text-green-600" />, label: 'Prontos', value: concluidos + publicados, bg: 'bg-green-50' },
          { icon: <Eye className="h-4 w-4 text-blue-600" />, label: 'Total Views', value: formatViews(totalViews), bg: 'bg-blue-50' },
          { icon: <Heart className="h-4 w-4 text-pink-500" />, label: 'Total Likes', value: formatViews(totalLikes), bg: 'bg-pink-50' },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg}`}>{stat.icon}</div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-xl font-black text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar vídeos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl border-gray-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] rounded-xl border-gray-200">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="processando">Processando</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="publicado">Publicado</SelectItem>
            <SelectItem value="erro">Erro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff0050]" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🎬</p>
            <p className="font-semibold">Nenhum vídeo encontrado</p>
            <p className="text-sm mt-1">Crie seu primeiro vídeo TikTok!</p>
            <Button onClick={() => navigate('/criar')} className="mt-4 bg-[#ff0050] text-white rounded-xl">
              Criar Vídeo
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="font-bold text-gray-700">Vídeo</TableHead>
                <TableHead className="font-bold text-gray-700">Nicho</TableHead>
                <TableHead className="font-bold text-gray-700">Status</TableHead>
                <TableHead className="font-bold text-gray-700">Performance</TableHead>
                <TableHead className="font-bold text-gray-700">Data</TableHead>
                <TableHead className="text-right font-bold text-gray-700">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVideos.map((video) => {
                const status = statusConfig[video.status] || statusConfig.pendente;
                return (
                  <TableRow key={video.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{video.titulo}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{video.duracao}s</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{nichoEmoji[video.nicho] || '📹'} {video.nicho}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        <Badge className={`${status.color} border-0 text-xs font-semibold`}>{status.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(video.tiktokViews || 0) > 0 ? (
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {formatViews(video.tiktokViews || 0)}</span>
                          <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-pink-400" /> {formatViews(video.tiktokLikes || 0)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">{new Date(video.criadoEm).toLocaleDateString('pt-BR')}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* Botão Ver */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl rounded-2xl">
                            <DialogHeader>
                              <DialogTitle className="font-black text-lg">{video.titulo}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`${status.color} border-0`}>{status.label}</Badge>
                                <Badge variant="secondary">{nichoEmoji[video.nicho]} {video.nicho}</Badge>
                                <Badge variant="secondary">{video.duracao}s</Badge>
                              </div>

                              {video.roteiro && (
                                <div>
                                  <h4 className="font-bold text-gray-900 text-sm mb-1">Roteiro</h4>
                                  <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 rounded-xl p-3 max-h-32 overflow-y-auto">{video.roteiro}</p>
                                </div>
                              )}

                              {video.hashtags && video.hashtags.length > 0 && (
                                <div>
                                  <h4 className="font-bold text-gray-900 text-sm mb-2">Hashtags</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {video.hashtags.map((tag) => (
                                      <Badge key={tag} variant="secondary" className="text-xs rounded-full">{tag}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {video.videoUrl && (
                                <div>
                                  <h4 className="font-bold text-gray-900 text-sm mb-2">Preview do Vídeo</h4>
                                  <div className="flex gap-4 items-start">
                                    <div className="aspect-[9/16] w-[160px] rounded-2xl overflow-hidden bg-black border border-gray-200 flex-shrink-0">
                                      <video
                                        src={`${API}${video.videoUrl}`}
                                        controls
                                        className="w-full h-full object-contain"
                                        poster={video.thumbnailUrl ? `${API}${video.thumbnailUrl}` : undefined}
                                      />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <a
                                        href={`${API}/download/${video.videoUrl.split('/').pop()}`}
                                        download
                                        className="inline-flex items-center gap-2 bg-[#ff0050] text-white text-xs font-bold px-3 py-2 rounded-xl hover:opacity-90"
                                      >
                                        <Download className="h-3.5 w-3.5" /> Baixar MP4
                                      </a>
                                      <a
                                        href={`${API}${video.videoUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-gray-200"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" /> Abrir no navegador
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {video.status === 'processando' && (
                                <div className="flex items-center gap-2 text-blue-600 text-sm">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Gerando vídeo... atualize em alguns segundos.
                                </div>
                              )}

                              {video.erro && (
                                <div className="bg-red-50 rounded-xl p-3">
                                  <p className="text-red-700 text-xs font-semibold">Erro:</p>
                                  <p className="text-red-600 text-xs mt-1">{video.erro}</p>
                                </div>
                              )}

                              {video.tiktokUrl && (
                                <Button variant="outline" className="w-full rounded-xl" asChild>
                                  <a href={video.tiktokUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Ver no TikTok
                                  </a>
                                </Button>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Botão Download direto */}
                        {video.videoUrl && (
                          <a
                            href={`${API}/download/${video.videoUrl.split('/').pop()}`}
                            download
                          >
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}

                        {/* Botão Deletar */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(video.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
