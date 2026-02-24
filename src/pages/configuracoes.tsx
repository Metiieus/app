import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ApiConfig {
  chave: string;
  valor: string;
  mostrar: boolean;
  testado: boolean | null;
}

const configuracoesIniciais: ApiConfig[] = [
  {
    chave: 'GEMINI_API_KEY',
    valor: '',
    mostrar: false,
    testado: null,
  },
  {
    chave: 'OPENAI_API_KEY',
    valor: '',
    mostrar: false,
    testado: null,
  },
  {
    chave: 'YOUTUBE_API_KEY',
    valor: '',
    mostrar: false,
    testado: null,
  },
  {
    chave: 'YOUTUBE_REFRESH_TOKEN',
    valor: '',
    mostrar: false,
    testado: null,
  },
];

const mockHistorico = [
  {
    id: '1',
    chave: 'GEMINI_API_KEY',
    acao: 'Atualizada',
    data: '2024-01-26T10:00:00',
  },
  {
    id: '2',
    chave: 'OPENAI_API_KEY',
    acao: 'Testada',
    data: '2024-01-25T14:30:00',
  },
];

export function ConfiguracoesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [configs, setConfigs] = useState<ApiConfig[]>(configuracoesIniciais);
  const [salvando, setSalvando] = useState(false);

  const handleTest = async (index: number) => {
    const config = configs[index];
    
    // Simular teste de conexão
    toast({
      title: 'Testando conexão...',
      description: `Verificando ${config.chave}...`,
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simular resultado (aleatório para demonstração)
    const sucesso = Math.random() > 0.3;

    setConfigs((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, testado: sucesso } : c
      )
    );

    toast({
      title: sucesso ? 'Conexão estabelecida!' : 'Falha na conexão',
      description: sucesso
        ? `${config.chave} está funcionando corretamente.`
        : `Verifique se a chave ${config.chave} está correta.`,
      variant: sucesso ? 'default' : 'destructive',
    });
  };

  const handleSave = async () => {
    setSalvando(true);

    // Simular salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: 'Configurações salvas!',
      description: 'Todas as chaves de API foram atualizadas.',
    });

    setSalvando(false);
  };

  const toggleMostrar = (index: number) => {
    setConfigs((prev) =>
      prev.map((c, i) => (i === index ? { ...c, mostrar: !c.mostrar } : c))
    );
  };

  const updateValor = (index: number, valor: string) => {
    setConfigs((prev) =>
      prev.map((c, i) => (i === index ? { ...c, valor, testado: null } : c))
    );
  };

  const getLabel = (chave: string) => {
    const labels: Record<string, string> = {
      GEMINI_API_KEY: 'Gemini API Key',
      OPENAI_API_KEY: 'OpenAI API Key',
      YOUTUBE_API_KEY: 'YouTube API Key',
      YOUTUBE_REFRESH_TOKEN: 'YouTube Refresh Token',
    };
    return labels[chave] || chave;
  };

  const getDescricao = (chave: string) => {
    const descricoes: Record<string, string> = {
      GEMINI_API_KEY: 'Usada para gerar roteiros com IA',
      OPENAI_API_KEY: 'Usada para gerar imagens com DALL-E',
      YOUTUBE_API_KEY: 'Usada para publicar vídeos no YouTube',
      YOUTUBE_REFRESH_TOKEN: 'Token de refresh para autenticação OAuth2',
    };
    return descricoes[chave] || '';
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500">Gerencie suas chaves de API</p>
        </div>
      </div>

      {/* APIs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Chaves de API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {configs.map((config, index) => (
            <div key={config.chave} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={config.chave}>{getLabel(config.chave)}</Label>
                {config.testado !== null && (
                  <Badge
                    variant={config.testado ? 'default' : 'destructive'}
                    className="gap-1"
                  >
                    {config.testado ? (
                      <>
                        <Check className="h-3 w-3" />
                        OK
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3" />
                        Falhou
                      </>
                    )}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">{getDescricao(config.chave)}</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={config.chave}
                    type={config.mostrar ? 'text' : 'password'}
                    value={config.valor}
                    onChange={(e) => updateValor(index, e.target.value)}
                    placeholder={`Digite sua ${getLabel(config.chave)}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => toggleMostrar(index)}
                  >
                    {config.mostrar ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleTest(index)}
                  disabled={!config.valor}
                >
                  Testar
                </Button>
              </div>
            </div>
          ))}

          <Button
            onClick={handleSave}
            disabled={salvando}
            className="w-full"
          >
            {salvando ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Alterações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockHistorico.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{getLabel(item.chave)}</p>
                  <p className="text-sm text-gray-500">{item.acao}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(item.data).toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
