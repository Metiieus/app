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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

// Dados mockados
const mockVideos = [
  {
    id: '1',
    titulo: 'Charizard - O Dragão de Fogo',
    tema: 'Charizard',
    status: 'publicado',
    criadoEm: '2024-01-26T10:00:00',
    roteiro: 'Hoje vamos conhecer Charizard, um dos Pokémon mais icônicos de todos os tempos...',
    hashtags: ['#Pokemon', '#Charizard', '#RPG'],
    videoUrl: '/video/1.mp4',
    thumbnailUrl: '/thumbnail/1.jpg',
  },
  {
    id: '2',
    titulo: 'Dragonite - O Dragão Bondoso',
    tema: 'Dragonite',
    status: 'concluido',
    criadoEm: '2024-01-25T14:30:00',
    roteiro: 'Dragonite é conhecido como o Pokémon Dragão mais amigável...',
    hashtags: ['#Pokemon', '#Dragonite', '#Dragao'],
    videoUrl: '/video/2.mp4',
    thumbnailUrl: '/thumbnail/2.jpg',
  },
  {
    id: '3',
    titulo: 'Alakazam - Mestre da Telecinese',
    tema: 'Alakazam',
    status: 'processando',
    criadoEm: '2024-01-24T09:15:00',
    roteiro: 'Com um QI de 5000, Alakazam é um dos Pokémon mais inteligentes...',
    hashtags: ['#Pokemon', '#Alakazam', '#Psiquico'],
    videoUrl: null,
    thumbnailUrl: null,
  },
  {
    id: '4',
    titulo: 'Gengar - O Fantasma Travesso',
    tema: 'Gengar',
    status: 'erro',
    criadoEm: '2024-01-23T16:45:00',
    roteiro: 'Gengar adora assustar pessoas à noite...',
    hashtags: ['#Pokemon', '#Gengar', '#Fantasma'],
    videoUrl: null,
    thumbnailUrl: null,
  },
  {
    id: '5',
    titulo: 'Mewtwo - A Lenda Genética',
    tema: 'Mewtwo',
    status: 'pendente',
    criadoEm: '2024-01-22T11:20:00',
    roteiro: 'Criado em laboratório, Mewtwo é um dos Pokémon mais poderosos...',
    hashtags: ['#Pokemon', '#Mewtwo', '#Lendario'],
    videoUrl: null,
    thumbnailUrl: null,
  },
];

const statusColors: Record<string, string> = {
  pendente: 'bg-gray-100 text-gray-800',
  processando: 'bg-blue-100 text-blue-800',
  concluido: 'bg-green-100 text-green-800',
  publicado: 'bg-purple-100 text-purple-800',
  erro: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  processando: 'Processando',
  concluido: 'Concluído',
  publicado: 'Publicado',
  erro: 'Erro',
};

export function HistoricoPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [, setSelectedVideo] = useState<typeof mockVideos[0] | null>(null);

  const filteredVideos = mockVideos.filter((video) => {
    const matchesSearch = video.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || video.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (_id: string) => {
    toast({
      title: 'Vídeo deletado',
      description: 'O vídeo foi removido com sucesso.',
    });
  };

  const handleRegenerate = (_id: string) => {
    toast({
      title: 'Regeneração iniciada',
      description: 'O vídeo está sendo regenerado.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico</h1>
          <p className="text-gray-500">Gerencie todos os seus vídeos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar vídeos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar por status" />
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
      </div>

      {/* Tabela */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tema</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVideos.map((video) => (
              <TableRow key={video.id}>
                <TableCell className="font-medium">{video.titulo}</TableCell>
                <TableCell>{video.tema}</TableCell>
                <TableCell>
                  <Badge className={statusColors[video.status]}>
                    {statusLabels[video.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(video.criadoEm).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedVideo(video)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>{video.titulo}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">Roteiro</h4>
                            <p className="mt-1 text-gray-600">{video.roteiro}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Hashtags</h4>
                            <div className="mt-1 flex gap-2">
                              {video.hashtags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {video.videoUrl && (
                            <div>
                              <h4 className="font-semibold text-gray-900">Vídeo</h4>
                              <div className="mt-2 aspect-video rounded-lg bg-gray-100 flex items-center justify-center">
                                <Play className="h-12 w-12 text-gray-400" />
                              </div>
                            </div>
                          )}
                          {video.thumbnailUrl && (
                            <div>
                              <h4 className="font-semibold text-gray-900">Thumbnail</h4>
                              <div className="mt-2 aspect-video w-64 rounded-lg bg-gray-100" />
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRegenerate(video.id)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Regenerar
                        </DropdownMenuItem>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
