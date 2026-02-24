import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Mic,
  Image,
  Film,
  ImageIcon,
  Play,
  Loader2,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ModuloTeste {
  id: string;
  nome: string;
  icone: React.ElementType;
  descricao: string;
  inputLabel: string;
  inputPlaceholder: string;
  inputType: 'text' | 'textarea';
}

const modulos: ModuloTeste[] = [
  {
    id: 'gemini',
    nome: 'Gerar Roteiro (Gemini)',
    icone: FileText,
    descricao: 'Teste a geração de roteiros com a API Gemini',
    inputLabel: 'Tema do vídeo',
    inputPlaceholder: 'Ex: Charizard, o dragão de fogo',
    inputType: 'text',
  },
  {
    id: 'tts',
    nome: 'Gerar Narração (Edge TTS)',
    icone: Mic,
    descricao: 'Teste a síntese de voz com Edge TTS',
    inputLabel: 'Texto para narração',
    inputPlaceholder: 'Digite o texto que será convertido em áudio...',
    inputType: 'textarea',
  },
  {
    id: 'dalle',
    nome: 'Gerar Imagem (DALL-E)',
    icone: Image,
    descricao: 'Teste a geração de imagens com DALL-E',
    inputLabel: 'Prompt da imagem',
    inputPlaceholder: 'Ex: Epic Charizard scene, cinematic lighting...',
    inputType: 'textarea',
  },
  {
    id: 'ffmpeg',
    nome: 'Gerar Vídeo (FFmpeg)',
    icone: Film,
    descricao: 'Teste a montagem de vídeo com FFmpeg',
    inputLabel: 'URL do áudio',
    inputPlaceholder: 'Cole a URL do arquivo de áudio...',
    inputType: 'text',
  },
  {
    id: 'pillow',
    nome: 'Gerar Thumbnail (Pillow)',
    icone: ImageIcon,
    descricao: 'Teste a geração de thumbnails com Pillow',
    inputLabel: 'Título do vídeo',
    inputPlaceholder: 'Ex: Charizard - O Dragão Lendário',
    inputType: 'text',
  },
];

interface TesteResult {
  sucesso: boolean;
  mensagem: string;
  output?: string;
  tempoExecucao?: number;
}

export function TesteModulosPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, TesteResult>>({});

  const handleTest = async (modulo: ModuloTeste) => {
    const input = inputs[modulo.id];
    if (!input) {
      toast({
        title: 'Campo obrigatório',
        description: 'Preencha o campo de entrada antes de testar.',
        variant: 'destructive',
      });
      return;
    }

    setLoading((prev) => ({ ...prev, [modulo.id]: true }));
    const inicio = Date.now();

    // Simular processamento
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const tempoExecucao = (Date.now() - inicio) / 1000;

    // Simular resultado
    let resultado: TesteResult;

    switch (modulo.id) {
      case 'gemini':
        resultado = {
          sucesso: true,
          mensagem: 'Roteiro gerado com sucesso!',
          output: `🎬 ${input} - A Lenda\n\nIntrodução:\nHoje vamos mergulhar no incrível mundo de ${input}, um dos Pokémon mais icônicos...\n\nDesenvolvimento:\nCom suas habilidades únicas e história fascinante, ${input} conquistou fãs ao redor do mundo...\n\nConclusão:\nE aí, qual é a sua história favorita com ${input}? Deixe nos comentários!`,
          tempoExecucao,
        };
        break;
      case 'tts':
        resultado = {
          sucesso: true,
          mensagem: 'Áudio gerado com sucesso!',
          output: '🎵 Arquivo de áudio gerado: /audio/teste.mp3\n\nDuração: 15s\nVoz: pt-BR-FranciscaNeural',
          tempoExecucao,
        };
        break;
      case 'dalle':
        resultado = {
          sucesso: true,
          mensagem: 'Imagem gerada com sucesso!',
          output: '🖼️ Imagem gerada: https://oaidalleapiprodscus.blob.core.windows.net/...\n\nDimensões: 1024x1024\nModelo: DALL-E 3',
          tempoExecucao,
        };
        break;
      case 'ffmpeg':
        resultado = {
          sucesso: true,
          mensagem: 'Vídeo montado com sucesso!',
          output: '🎬 Vídeo gerado: /video/teste.mp4\n\nResolução: 1080x1920 (9:16)\nDuração: 60s\nFormato: MP4 (H.264)',
          tempoExecucao,
        };
        break;
      case 'pillow':
        resultado = {
          sucesso: true,
          mensagem: 'Thumbnail gerada com sucesso!',
          output: '🖼️ Thumbnail gerada: /thumbnail/teste.jpg\n\nDimensões: 1280x720\nTexto: "' + input + '"',
          tempoExecucao,
        };
        break;
      default:
        resultado = {
          sucesso: false,
          mensagem: 'Módulo não reconhecido',
          tempoExecucao,
        };
    }

    setResults((prev) => ({ ...prev, [modulo.id]: resultado }));
    setLoading((prev) => ({ ...prev, [modulo.id]: false }));

    toast({
      title: resultado.sucesso ? 'Sucesso!' : 'Erro',
      description: resultado.mensagem,
      variant: resultado.sucesso ? 'default' : 'destructive',
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
          <h1 className="text-2xl font-bold text-gray-900">Teste de Módulos</h1>
          <p className="text-gray-500">Teste individualmente cada componente</p>
        </div>
      </div>

      {/* Módulos */}
      <div className="grid gap-6">
        {modulos.map((modulo) => {
          const Icon = modulo.icone;
          const result = results[modulo.id];
          const isLoading = loading[modulo.id];

          return (
            <Card key={modulo.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg">{modulo.nome}</div>
                    <div className="text-sm font-normal text-gray-500">
                      {modulo.descricao}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={modulo.id}>{modulo.inputLabel}</Label>
                  {modulo.inputType === 'textarea' ? (
                    <Textarea
                      id={modulo.id}
                      placeholder={modulo.inputPlaceholder}
                      value={inputs[modulo.id] || ''}
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          [modulo.id]: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                  ) : (
                    <Input
                      id={modulo.id}
                      placeholder={modulo.inputPlaceholder}
                      value={inputs[modulo.id] || ''}
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          [modulo.id]: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>

                <Button
                  onClick={() => handleTest(modulo)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Testar
                    </>
                  )}
                </Button>

                {result && (
                  <div
                    className={`rounded-lg p-4 ${
                      result.sucesso
                        ? 'bg-green-50 text-green-800'
                        : 'bg-red-50 text-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">{result.mensagem}</span>
                      {result.tempoExecucao && (
                        <Badge variant="secondary" className="ml-auto gap-1">
                          <Clock className="h-3 w-3" />
                          {result.tempoExecucao.toFixed(2)}s
                        </Badge>
                      )}
                    </div>
                    {result.output && (
                      <pre className="mt-3 whitespace-pre-wrap rounded bg-white/50 p-3 text-sm">
                        {result.output}
                      </pre>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
