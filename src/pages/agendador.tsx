import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Dados mockados
const mockAgendamentos = [
  {
    id: '1',
    tema: 'Charizard',
    descricao: 'Vídeo semanal sobre Charizard',
    tipo: 'semanal',
    proximaExecucao: '2024-01-29T10:00:00',
    ultimaExecucao: '2024-01-22T10:00:00',
    ativo: true,
  },
  {
    id: '2',
    tema: 'Dragonite',
    descricao: 'Vídeo diário sobre Dragonite',
    tipo: 'diaria',
    proximaExecucao: '2024-01-27T14:00:00',
    ultimaExecucao: '2024-01-26T14:00:00',
    ativo: true,
  },
  {
    id: '3',
    tema: 'Mewtwo',
    descricao: 'Vídeo mensal especial',
    tipo: 'mensal',
    proximaExecucao: '2024-02-01T09:00:00',
    ultimaExecucao: '2024-01-01T09:00:00',
    ativo: false,
  },
];

const tipoLabels: Record<string, string> = {
  uma_vez: 'Uma vez',
  diaria: 'Diária',
  semanal: 'Semanal',
  mensal: 'Mensal',
};

export function AgendadorPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('10:00');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tema: '',
    descricao: '',
    tipo: 'semanal',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Agendamento criado!',
      description: `Próxima execução: ${date ? format(date, 'PPP', { locale: ptBR }) : ''} às ${time}`,
    });
    setShowForm(false);
    setFormData({ tema: '', descricao: '', tipo: 'semanal' });
    setDate(undefined);
  };

  const handleToggle = (_id: string, ativo: boolean) => {
    toast({
      title: ativo ? 'Agendamento pausado' : 'Agendamento ativado',
      description: `O agendamento foi ${ativo ? 'pausado' : 'ativado'} com sucesso.`,
    });
  };

  const handleDelete = (_id: string) => {
    toast({
      title: 'Agendamento deletado',
      description: 'O agendamento foi removido com sucesso.',
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
            <h1 className="text-2xl font-bold text-gray-900">Agendador</h1>
            <p className="text-gray-500">Programe a criação automática de vídeos</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Agendamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tema">Tema</Label>
                  <Input
                    id="tema"
                    placeholder="Ex: Charizard"
                    value={formData.tema}
                    onChange={(e) =>
                      setFormData({ ...formData, tema: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Recorrência</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uma_vez">Uma vez</SelectItem>
                      <SelectItem value="diaria">Diária</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o conteúdo do vídeo..."
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {date ? (
                          format(date, 'PPP', { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={!date || !formData.tema}>
                  Criar Agendamento
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Agendamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tema</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Próxima Execução</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAgendamentos.map((agendamento) => (
                <TableRow key={agendamento.id}>
                  <TableCell className="font-medium">
                    {agendamento.tema}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {tipoLabels[agendamento.tipo]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(agendamento.proximaExecucao), 'PPp', {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        agendamento.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {agendamento.ativo ? 'Ativo' : 'Pausado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleToggle(agendamento.id, agendamento.ativo)
                        }
                      >
                        {agendamento.ativo ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(agendamento.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
