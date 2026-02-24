import { useNavigate } from 'react-router-dom';
import {
  Video,
  CheckCircle,
  XCircle,
  TrendingUp,
  Plus,
  Clock,
  Play,
  Monitor,
  Zap,
  Eye,
  Heart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

// Dados mockados para o dashboard
const mockStats = {
  total: 127,
  publicados: 118,
  comErro: 9,
  taxaSucesso: 93,
  totalViews: 842000,
  totalLikes: 54300,
  videosPorDia: [
    { data: '20/02', count: 8, views: 12400 },
    { data: '21/02', count: 12, views: 18700 },
    { data: '22/02', count: 7, views: 9800 },
    { data: '23/02', count: 15, views: 24100 },
    { data: '24/02', count: 11, views: 16500 },
    { data: '25/02', count: 18, views: 31200 },
    { data: '26/02', count: 21, views: 38900 },
  ],
};

const quickActions = [
  {
    name: 'Criar Vídeo',
    description: 'Gerar novo conteúdo viral',
    icon: Plus,
    href: '/criar',
    gradient: 'from-[#ff0050] to-[#ff4d7d]',
  },
  {
    name: 'Agendador',
    description: 'Postar no horário certo',
    icon: Clock,
    href: '/agendador',
    gradient: 'from-[#7c3aed] to-[#a855f7]',
  },
  {
    name: 'Histórico',
    description: 'Ver vídeos criados',
    icon: Play,
    href: '/historico',
    gradient: 'from-[#059669] to-[#10b981]',
  },
  {
    name: 'Painel de Controle',
    description: 'Monitorar processos',
    icon: Monitor,
    href: '/painel',
    gradient: 'from-[#d97706] to-[#f59e0b]',
  },
];

const topNichos = [
  { nome: 'Motivacional', videos: 34, views: '210K' },
  { nome: 'Curiosidades', videos: 28, views: '180K' },
  { nome: 'Humor', videos: 22, views: '155K' },
  { nome: 'Educativo', videos: 19, views: '142K' },
  { nome: 'Lifestyle', videos: 15, views: '98K' },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
          <p className="mt-1 text-gray-500">
            Sua máquina de vídeos TikTok está funcionando 🚀
          </p>
        </div>
        <Button
          onClick={() => navigate('/criar')}
          className="bg-gradient-to-r from-[#ff0050] to-[#ff4d7d] hover:opacity-90 text-white font-bold shadow-lg shadow-[#ff0050]/20 rounded-xl"
        >
          <Zap className="mr-2 h-4 w-4" />
          Criar Agora
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-[#ff0050]/5 to-[#ff4d7d]/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">
              Total de Vídeos
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff0050]/10">
              <Video className="h-4 w-4 text-[#ff0050]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">
              {mockStats.total}
            </div>
            <p className="text-xs text-gray-500 mt-1">Criados no total</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">
              Publicados
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">
              {mockStats.publicados}
            </div>
            <p className="text-xs text-gray-500 mt-1">No TikTok</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">
              Total de Views
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <Eye className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">
              842K
            </div>
            <p className="text-xs text-gray-500 mt-1">Visualizações totais</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">
              Taxa de Sucesso
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">
              {mockStats.taxaSucesso}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Publicados com sucesso</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Ações Rápidas
        </h2>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gráfico de Vídeos por Dia */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-bold text-gray-900">Vídeos Criados por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockStats.videosPorDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="data" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #f0f0f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="count" fill="#ff0050" radius={[6, 6, 0, 0]} name="Vídeos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Nichos */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-bold text-gray-900">Top Nichos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topNichos.map((nicho, index) => (
                <div key={nicho.nome} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{nicho.nome}</p>
                      <p className="text-xs text-gray-500">{nicho.videos} vídeos</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {nicho.views}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Views por Dia */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-bold text-gray-900">Views por Dia</CardTitle>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-[#ff0050]" />
              <span className="text-sm font-semibold text-gray-600">54.3K curtidas totais</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockStats.videosPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #f0f0f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number) => [`${(value / 1000).toFixed(1)}K`, 'Views']}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#00f2ea"
                  strokeWidth={3}
                  dot={{ fill: '#00f2ea', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#ff0050' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
