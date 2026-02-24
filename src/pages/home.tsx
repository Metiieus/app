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
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Dados mockados para o dashboard
const mockStats = {
  total: 42,
  publicados: 38,
  comErro: 4,
  taxaSucesso: 90,
  videosPorDia: [
    { data: '2024-01-20', count: 3 },
    { data: '2024-01-21', count: 5 },
    { data: '2024-01-22', count: 2 },
    { data: '2024-01-23', count: 7 },
    { data: '2024-01-24', count: 4 },
    { data: '2024-01-25', count: 6 },
    { data: '2024-01-26', count: 8 },
  ],
};

const quickActions = [
  {
    name: 'Criar Vídeo',
    description: 'Iniciar novo projeto',
    icon: Plus,
    href: '/criar',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    name: 'Agendador',
    description: 'Gerenciar agendamentos',
    icon: Clock,
    href: '/agendador',
    color: 'bg-purple-600 hover:bg-purple-700',
  },
  {
    name: 'Histórico',
    description: 'Ver vídeos criados',
    icon: Play,
    href: '/historico',
    color: 'bg-green-600 hover:bg-green-700',
  },
  {
    name: 'Painel de Controle',
    description: 'Monitorar processos',
    icon: Monitor,
    href: '/painel',
    color: 'bg-orange-600 hover:bg-orange-700',
  },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">
          Bem-vindo ao RPmon Dashboard! Gerencie seus vídeos Pokémon + RPG.
        </p>
      </div>

      {/* Alerta Informativo */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Dica:</strong> Configure suas chaves de API em{' '}
          <Button
            variant="link"
            className="h-auto p-0 text-blue-700"
            onClick={() => navigate('/configuracoes')}
          >
            Configurações
          </Button>{' '}
          para começar a criar vídeos automaticamente.
        </AlertDescription>
      </Alert>

      {/* Estatísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Vídeos
            </CardTitle>
            <Video className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {mockStats.total}
            </div>
            <p className="text-xs text-gray-500">Criados no total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Publicados
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {mockStats.publicados}
            </div>
            <p className="text-xs text-gray-500">No YouTube</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Com Erro
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {mockStats.comErro}
            </div>
            <p className="text-xs text-gray-500">Precisam atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Taxa de Sucesso
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {mockStats.taxaSucesso}%
            </div>
            <p className="text-xs text-gray-500">Média geral</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Ações Rápidas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.name}
                variant="outline"
                className="h-auto flex-col items-start gap-3 p-4 text-left hover:bg-gray-50"
                onClick={() => navigate(action.href)}
              >
                <div className={`rounded-lg p-2 ${action.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{action.name}</div>
                  <div className="text-sm text-gray-500">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Gráfico de Tendências */}
      <Card>
        <CardHeader>
          <CardTitle>Vídeos por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockStats.videosPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="data"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                    })
                  }
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString('pt-BR')
                  }
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
