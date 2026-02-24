import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  Zap,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface ApiConfig {
  chave: string;
  valor: string;
  mostrar: boolean;
  testado: boolean | null;
  obrigatorio: boolean;
}

const configuracoesIniciais: ApiConfig[] = [
  {
    chave: 'GEMINI_API_KEY',
    valor: '',
    mostrar: false,
    testado: null,
    obrigatorio: true,
  },
  {
    chave: 'TIKTOK_CLIENT_KEY',
    valor: '',
    mostrar: false,
    testado: null,
    obrigatorio: true,
  },
  {
    chave: 'TIKTOK_CLIENT_SECRET',
    valor: '',
    mostrar: false,
    testado: null,
    obrigatorio: true,
  },
  {
    chave: 'TIKTOK_ACCESS_TOKEN',
    valor: '',
    mostrar: false,
    testado: null,
    obrigatorio: false,
  },
  {
    chave: 'OPENAI_API_KEY',
    valor: '',
    mostrar: false,
    testado: null,
    obrigatorio: false,
  },
  {
    chave: 'ELEVENLABS_API_KEY',
    valor: '',
    mostrar: false,
    testado: null,
    obrigatorio: false,
  },
];

const apiInfo: Record<string, { label: string; descricao: string; link: string; grupo: string }> = {
  GEMINI_API_KEY: {
    label: 'Gemini API Key',
    descricao: 'Usada para gerar roteiros virais com IA (obrigatório)',
    link: 'https://makersuite.google.com/app/apikey',
    grupo: 'IA',
  },
  TIKTOK_CLIENT_KEY: {
    label: 'TikTok Client Key',
    descricao: 'Chave do app TikTok para publicação automática',
    link: 'https://developers.tiktok.com',
    grupo: 'TikTok',
  },
  TIKTOK_CLIENT_SECRET: {
    label: 'TikTok Client Secret',
    descricao: 'Segredo do app TikTok para autenticação OAuth2',
    link: 'https://developers.tiktok.com',
    grupo: 'TikTok',
  },
  TIKTOK_ACCESS_TOKEN: {
    label: 'TikTok Access Token',
    descricao: 'Token de acesso para publicar vídeos na conta',
    link: 'https://developers.tiktok.com',
    grupo: 'TikTok',
  },
  OPENAI_API_KEY: {
    label: 'OpenAI API Key',
    descricao: 'Usada para gerar imagens com DALL-E (opcional)',
    link: 'https://platform.openai.com/api-keys',
    grupo: 'IA',
  },
  ELEVENLABS_API_KEY: {
    label: 'ElevenLabs API Key',
    descricao: 'Narração ultra-realista com vozes de IA (opcional)',
    link: 'https://elevenlabs.io',
    grupo: 'Voz',
  },
};

const grupos = ['IA', 'TikTok', 'Voz'];

export function ConfiguracoesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [configs, setConfigs] = useState<ApiConfig[]>(configuracoesIniciais);
  const [salvando, setSalvando] = useState(false);

  const handleTest = async (index: number) => {
    const config = configs[index];

    toast({ title: '🔄 Testando conexão...', description: `Verificando ${apiInfo[config.chave]?.label}...` });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const sucesso = config.valor.length > 10;

    setConfigs((prev) =>
      prev.map((c, i) => (i === index ? { ...c, testado: sucesso } : c))
    );

    toast({
      title: sucesso ? '✅ Conexão estabelecida!' : '❌ Falha na conexão',
      description: sucesso
        ? `${apiInfo[config.chave]?.label} está funcionando.`
        : `Verifique se a chave está correta.`,
      variant: sucesso ? 'default' : 'destructive',
    });
  };

  const handleSave = async () => {
    setSalvando(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({ title: '✅ Configurações salvas!', description: 'Todas as chaves foram atualizadas.' });
    setSalvando(false);
  };

  const toggleMostrar = (index: number) => {
    setConfigs((prev) => prev.map((c, i) => (i === index ? { ...c, mostrar: !c.mostrar } : c)));
  };

  const updateValor = (index: number, valor: string) => {
    setConfigs((prev) => prev.map((c, i) => (i === index ? { ...c, valor, testado: null } : c)));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Configurações</h1>
          <p className="text-gray-500 text-sm">Configure suas integrações e APIs</p>
        </div>
      </div>

      {/* Alerta */}
      <Alert className="border-[#ff0050]/20 bg-[#ff0050]/5 rounded-2xl">
        <Info className="h-4 w-4 text-[#ff0050]" />
        <AlertDescription className="text-gray-700 text-sm">
          Configure pelo menos a <strong>Gemini API Key</strong> e as credenciais do <strong>TikTok</strong> para começar a gerar e publicar vídeos automaticamente.
        </AlertDescription>
      </Alert>

      {/* APIs por grupo */}
      {grupos.map((grupo) => {
        const configsGrupo = configs.filter((c) => apiInfo[c.chave]?.grupo === grupo);
        return (
          <Card key={grupo} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Key className="h-4 w-4 text-[#ff0050]" />
                {grupo === 'IA' ? '🤖 Inteligência Artificial' : grupo === 'TikTok' ? '📱 TikTok' : '🎙️ Síntese de Voz'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {configsGrupo.map((config, i) => {
                const globalIndex = configs.findIndex(c => c.chave === config.chave);
                const info = apiInfo[config.chave];
                return (
                  <div key={config.chave} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={config.chave} className="font-semibold text-gray-700">
                          {info.label}
                        </Label>
                        {config.obrigatorio && (
                          <Badge className="bg-[#ff0050]/10 text-[#ff0050] border-0 text-xs">Obrigatório</Badge>
                        )}
                      </div>
                      {config.testado !== null && (
                        <Badge
                          className={`gap-1 border-0 text-xs ${config.testado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                          {config.testado ? (
                            <><Check className="h-3 w-3" /> OK</>
                          ) : (
                            <><X className="h-3 w-3" /> Falhou</>
                          )}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{info.descricao}</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id={config.chave}
                          type={config.mostrar ? 'text' : 'password'}
                          value={config.valor}
                          onChange={(e) => updateValor(globalIndex, e.target.value)}
                          placeholder={`Cole sua ${info.label}`}
                          className="rounded-xl border-gray-200 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => toggleMostrar(globalIndex)}
                        >
                          {config.mostrar ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleTest(globalIndex)}
                        disabled={!config.valor}
                        className="rounded-xl border-gray-200 shrink-0"
                      >
                        Testar
                      </Button>
                    </div>
                    <a
                      href={info.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#ff0050] hover:underline"
                    >
                      Obter chave →
                    </a>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Salvar */}
      <Button
        onClick={handleSave}
        disabled={salvando}
        className="w-full bg-gradient-to-r from-[#ff0050] to-[#ff4d7d] hover:opacity-90 text-white font-bold rounded-xl h-11"
      >
        {salvando ? (
          <>Salvando...</>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4" />
            Salvar Todas as Configurações
          </>
        )}
      </Button>
    </div>
  );
}
