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
  Zap,
  TrendingUp,
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
    nicho: 'Motivacional',
    tema: 'motivacional',
    descricao: 'Frases motivacionais diárias para impulsionar o dia',
    tipo: 'diaria',
    horario: '07:00',
    proximaExecucao: '2026-02-25T07:00:00',
    ultimaExecucao: '2026-02-24T07:00:00',
    ativo: true,
    videosGerados: 28,
  },
  {
    id: '2',
    nicho: 'Curiosidades',
    tema: 'curiosidades',
    descricao: 'Fatos surpreendentes sobre ciência e natureza',
    tipo: 'diaria',
    horario: '12:00',
    proximaExecucao: '2026-02-25T12:00:00',
    ultimaExecucao: '2026-02-24T12:00:00',
    ativo: true,
    videosGerados: 21,
  },
  {
    id: '3',
    nicho: 'Finanças',
    tema: 'financas',
    descricao: 'Dicas semanais sobre investimentos e economia',
    tipo: 'semanal',
    horario: '18:00',
    proximaExecucao: '2026-03-03T18:00:00',
    ultimaExecucao: '2026-02-24T18:00:00',
    ativo: false,
    videosGerados: 8,
  },
];

const tipoConfig: Record<string, { label: string; color: string }> = {
  uma_vez: { label: 'Uma vez', color: 'bg-gray-100 text-gray-700' },
  diaria: { label: 'Diária', color: 'bg-blue-100 text-blue-700' },
  semanal: { label: 'Semanal', color: 'bg-purple-100 text-purple-700' },
  mensal: { label: 'Mensal', color: 'bg-orange-100 text-orange-700' },
};

const nichosTikTok = [
  { value: 'motivacional', label: '💪 Motivacional' },
  { value: 'curiosidades', label: '🤯 Curiosidades' },
  { value: 'humor', label: '😂 Humor' },
  { value: 'educativo', label: '📚 Educativo' },
  { value: 'lifestyle', label: '✨ Lifestyle' },
  { value: 'financas', label: '💰 Finanças' },
  { value: 'tecnologia', label: '🤖 Tecnologia' },
  { value: 'saude', label: '🏃 Saúde & Fitness' },
  { value: 'receitas', label: '🍕 Receitas' },
  { value: 'relacionamentos', label: '❤️ Relacionamentos' },
  { value: 'negocios', label: '📈 Negócios' },
  { value: 'espiritualidade', label: '🧘 Espiritualidade' },
];

const melhoresHorarios = [
  { horario: '07:00', desc: 'Manhã cedo — alta audiência' },
  { horario: '12:00', desc: 'Almoço — pico de uso' },
  { horario: '18:00', desc: 'Fim do dia — máximo engajamento' },
  { horario: '21:00', desc: 'Noite — audiência relaxada' },
];

export function AgendadorPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('18:00');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nicho: '',
    descricao: '',
    tipo: 'diaria',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: '✅ Agendamento criado!',
      description: `Próxima execução: ${date ? format(date, 'PPP', { locale: ptBR }) : ''} às ${time}`,
    });
    setShowForm(false);
    setFormData({ nicho: '', descricao: '', tipo: 'diaria' });
    setDate(undefined);
  };

  const handleToggle = (_id: string, ativo: boolean) => {
    toast({
      title: ativo ? '⏸️ Agendamento pausado' : '▶️ Agendamento ativado',
      description: `O agendamento foi ${ativo ? 'pausado' : 'ativado'} com sucesso.`,
    });
  };

  const handleDelete = (_id: string) => {
    toast({ title: 'Agendamento deletado', description: 'O agendamento foi removido.' });
  };

  const totalAtivos = mockAgendamentos.filter(a => a.ativo).length;
  const totalVideos = mockAgendamentos.reduce((acc, a) => acc + a.videosGerados, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Agendador</h1>
            <p className="text-gray-500 text-sm">Publique no horário certo, todos os dias</p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-[#ff0050] to-[#ff4d7d] hover:opacity-90 text-white font-bold rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-[#ff0050]/5 to-[#ff4d7d]/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff0050]/10">
                <Zap className="h-4 w-4 text-[#ff0050]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Ativos</p>
                <p className="text-xl font-black text-gray-900">{totalAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Agendamentos</p>
                <p className="text-xl font-black text-gray-900">{mockAgendamentos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Vídeos Gerados</p>
                <p className="text-xl font-black text-gray-900">{totalVideos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Melhores Horários */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#ff0050]" />
            Melhores Horários para Postar no TikTok
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {melhoresHorarios.map((h) => (
              <div key={h.horario} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                <p className="text-lg font-black text-[#ff0050]">{h.horario}</p>
                <p className="text-xs text-gray-500 mt-0.5">{h.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      {showForm && (
        <Card className="border-0 shadow-sm border-l-4 border-l-[#ff0050]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Novo Agendamento Automático</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nicho" className="font-semibold text-gray-700">Nicho de Conteúdo</Label>
                  <Select
                    value={formData.nicho}
                    onValueChange={(value) => setFormData({ ...formData, nicho: value })}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200">
                      <SelectValue placeholder="Selecione o nicho" />
                    </SelectTrigger>
                    <SelectContent>
                      {nichosTikTok.map((n) => (
                        <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="font-semibold text-gray-700">Frequência</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200">
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
                <Label htmlFor="descricao" className="font-semibold text-gray-700">Descrição do Conteúdo</Label>
                <Textarea
                  id="descricao"
                  placeholder="Ex: Vídeos motivacionais curtos com frases impactantes para começar o dia..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                  className="rounded-xl border-gray-200 resize-none"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-700">Data de Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal rounded-xl border-gray-200"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP', { locale: ptBR }) : <span className="text-gray-400">Selecione uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl">
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
                  <Label htmlFor="time" className="font-semibold text-gray-700">Horário de Publicação</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="pl-10 rounded-xl border-gray-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!date || !formData.nicho}
                  className="flex-1 bg-gradient-to-r from-[#ff0050] to-[#ff4d7d] hover:opacity-90 text-white font-bold rounded-xl"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Criar Agendamento
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Agendamentos */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Agendamentos Ativos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="font-bold text-gray-700">Nicho</TableHead>
                <TableHead className="font-bold text-gray-700">Frequência</TableHead>
                <TableHead className="font-bold text-gray-700">Próxima Publicação</TableHead>
                <TableHead className="font-bold text-gray-700">Vídeos</TableHead>
                <TableHead className="font-bold text-gray-700">Status</TableHead>
                <TableHead className="text-right font-bold text-gray-700">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAgendamentos.map((ag) => {
                const tipo = tipoConfig[ag.tipo];
                return (
                  <TableRow key={ag.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{ag.nicho}</p>
                        <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{ag.descricao}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${tipo.color} border-0 text-xs font-semibold`}>
                        {tipo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {format(new Date(ag.proximaExecucao), 'dd/MM', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(ag.proximaExecucao), 'HH:mm')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-gray-900">{ag.videosGerados}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${ag.ativo ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        <Badge className={`${ag.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'} border-0 text-xs font-semibold`}>
                          {ag.ativo ? 'Ativo' : 'Pausado'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleToggle(ag.id, ag.ativo)}
                        >
                          {ag.ativo ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleDelete(ag.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
