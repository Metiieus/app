import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Trash2,
  Play,
  MoreHorizontal,
  TrendingUp,
  Heart,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Dados mockados
const mockVideos = [
  {
    id: '1',
    titulo: '5 hábitos que vão mudar sua vida',
    nicho: 'Motivacional',
    tema: 'motivacional',
    status: 'publicado',
    criadoEm: '2026-02-24T10:00:00',
    roteiro: 'Você sabia que 90% das pessoas bem-sucedidas têm esses 5 hábitos em comum? Hoje vou te mostrar quais são e como implementar na sua rotina...',
    hashtags: ['#motivacao', '#habitos', '#produtividade', '#sucesso', '#tiktok'],
    videoUrl: '/video/1.mp4',
    thumbnailUrl: '/thumbnail/1.jpg',
    tiktokUrl: 'https://tiktok.com/@usuario/video/1',
    views: 142000,
    likes: 8900,
    duracao: '30s',
  },
  {
    id: '2',
    titulo: 'Você não vai acreditar nesse fato',
    nicho: 'Curiosidades',
    tema: 'curiosidades',
    status: 'publicado',
    criadoEm: '2026-02-23T14:30:00',
    roteiro: 'Esse fato vai te deixar sem palavras. Sabia que o mel nunca estraga? Arqueólogos encontraram mel de 3000 anos no Egito e ainda era comestível...',
    hashtags: ['#curiosidades', '#fatos', '#vocsabia', '#ciencia'],
    videoUrl: '/video/2.mp4',
    thumbnailUrl: '/thumbnail/2.jpg',
    tiktokUrl: 'https://tiktok.com/@usuario/video/2',
    views: 89000,
    likes: 5600,
    duracao: '15s',
  },
  {
    id: '3',
    titulo: 'Como ganhar dinheiro com IA em 2026',
    nicho: 'Finanças',
    tema: 'financas',
    status: 'processando',
    criadoEm: '2026-02-24T09:15:00',
    roteiro: 'A IA está criando novas formas de ganhar dinheiro que a maioria das pessoas ainda não conhece...',
    hashtags: ['#ia', '#dinheiro', '#renda', '#financas'],
    videoUrl: null,
    thumbnailUrl: null,
    tiktokUrl: null,
    views: 0,
    likes: 0,
    duracao: '60s',
  },
  {
    id: '4',
    titulo: 'Erro fatal ao investir',
    nicho: 'Finanças',
    tema: 'financas',
    status: 'erro',
    criadoEm: '2026-02-23T16:45:00',
    roteiro: 'O erro que faz 90% dos investidores perderem dinheiro...',
    hashtags: ['#investimentos', '#dinheiro', '#erros'],
    videoUrl: null,
    thumbnailUrl: null,
    tiktokUrl: null,
    views: 0,
    likes: 0,
    duracao: '30s',
  },
  {
    id: '5',
    titulo: 'Receita de bolo em 3 minutos',
    nicho: 'Receitas',
    tema: 'receitas',
    status: 'concluido',
    criadoEm: '2026-02-22T11:20:00',
    roteiro: 'O bolo mais fácil e gostoso que você vai fazer na sua vida, em apenas 3 minutos...',
    hashtags: ['#receita', '#bolo', '#culinaria', '#facil'],
    videoUrl: '/video/5.mp4',
    thumbnailUrl: '/thumbnail/5.jpg',
    tiktokUrl: null,
    views: 0,
    likes: 0,
    duracao: '60s',
  },
];

const statusConfig: Record<string, { color: string; label: string; dot: string }> = {
  pendente: { color: 'bg-gray-100 text-gray-700', label: 'Pendente', dot: 'bg-gray-400' },
  processando: { color: 'bg-blue-100 text-blue-700', label: 'Processando', dot: 'bg-blue-500 animate-pulse' },
  concluido: { color: 'bg-green-100 text-green-700', label: 'Concluído', dot: 'bg-green-500' },
  publicado: { color: 'bg-[#ff0050]/10 text-[#ff0050]', label: 'Publicado', dot: 'bg-[#ff0050]' },
  erro: { color: 'bg-red-100 text-red-700', label: 'Erro', dot: 'bg-red-500' },
};

const nichoEmoji: Record<string, string> = {
  motivacional: '💪',
  curiosidades: '🤯',
  humor: '😂',
  educativo: '📚',
  lifestyle: '✨',
  financas: '💰',
  tecnologia: '🤖',
  saude: '🏃',
  receitas: '🍕',
  relacionamentos: '❤️',
  negocios: '📈',
  espiritualidade: '🧘',
};

function formatViews(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

export function HistoricoPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const filteredVideos = mockVideos.filter((video) => {
    const matchesSearch = video.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || video.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (_id: string) => {
    toast({ title: 'Vídeo deletado', description: 'O vídeo foi removido com sucesso.' });
  };

  const handleRegenerate = (_id: string) => {
    toast({ title: '🔄 Regeneração iniciada', description: 'O vídeo está sendo regenerado.' });
  };

  const totalViews = mockVideos.reduce((acc, v) => acc + v.views, 0);
  const totalLikes = mockVideos.reduce((acc, v) => acc + v.likes, 0);
  const publicados = mockVideos.filter(v => v.status === 'publicado').length;

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
        <Button
          onClick={() => navigate('/criar')}
          className="bg-gradient-to-r from-[#ff0050] to-[#ff4d7d] hover:opacity-90 text-white font-bold rounded-xl"
        >
          + Novo Vídeo
        </Button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff0050]/10">
                <TrendingUp className="h-4 w-4 text-[#ff0050]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Publicados</p>
                <p className="text-xl font-black text-gray-900">{publicados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Views</p>
                <p className="text-xl font-black text-gray-900">{formatViews(totalViews)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50">
                <Heart className="h-4 w-4 text-pink-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Likes</p>
                <p className="text-xl font-black text-gray-900">{formatViews(totalLikes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
              const status = statusConfig[video.status];
              return (
                <TableRow key={video.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{video.titulo}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{video.duracao}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {nichoEmoji[video.tema] || '📹'} {video.nicho}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      <Badge className={`${status.color} border-0 text-xs font-semibold`}>
                        {status.label}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {video.status === 'publicado' ? (
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {formatViews(video.views)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-pink-400" /> {formatViews(video.likes)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(video.criadoEm).toLocaleDateString('pt-BR')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
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
                              <Badge className={`${statusConfig[video.status].color} border-0`}>
                                {statusConfig[video.status].label}
                              </Badge>
                              <Badge variant="secondary">{video.nicho}</Badge>
                              <Badge variant="secondary">{video.duracao}</Badge>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm mb-1">Roteiro</h4>
                              <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 rounded-xl p-3">{video.roteiro}</p>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm mb-2">Hashtags</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {video.hashtags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs rounded-full">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            {video.videoUrl && (
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm mb-2">Preview do Vídeo</h4>
                                <div className="flex gap-4 items-start">
                                  <div className="aspect-[9/16] w-[160px] rounded-2xl overflow-hidden bg-black border border-gray-200 flex-shrink-0">
                                    <video
                                      src={`http://localhost:3001${video.videoUrl}`}
                                      controls
                                      className="w-full h-full object-contain"
                                      poster={video.thumbnailUrl ? `http://localhost:3001${video.thumbnailUrl}` : undefined}
                                    />
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <a
                                      href={`http://localhost:3001/download/${video.videoUrl.split('/').pop()}`}
                                      download
                                      className="inline-flex items-center gap-2 bg-[#ff0050] text-white text-xs font-bold px-3 py-2 rounded-xl hover:opacity-90"
                                    >
                                      ⬇️ Baixar MP4
                                    </a>
                                    <a
                                      href={`http://localhost:3001${video.videoUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-gray-200"
                                    >
                                      🔗 Abrir no navegador
                                    </a>
                                  </div>
                                </div>
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

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          {video.tiktokUrl && (
                            <DropdownMenuItem>
                              <Share2 className="mr-2 h-4 w-4" />
                              Compartilhar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleRegenerate(video.id)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Regenerar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(video.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
