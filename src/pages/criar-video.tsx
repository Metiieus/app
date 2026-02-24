import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

const temasPokemon = [
  'Charizard',
  'Dragonite',
  'Alakazam',
  'Gengar',
  'Gyarados',
  'Mewtwo',
  'Rayquaza',
  'Lucario',
  'Garchomp',
  'Salamence',
  'Metagross',
  'Tyranitar',
];

const etapas = [
  { id: 'roteiro', nome: 'Roteiro', descricao: 'Gerando roteiro épico...' },
  { id: 'narracao', nome: 'Narração', descricao: 'Sintetizando voz...' },
  { id: 'imagem', nome: 'Imagens', descricao: 'Criando imagens com IA...' },
  { id: 'video', nome: 'Vídeo', descricao: 'Montando vídeo final...' },
  { id: 'thumbnail', nome: 'Thumbnail', descricao: 'Gerando thumbnail...' },
];

export function CriarVideoPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [formData, setFormData] = useState({
    titulo: '',
    tema: '',
    descricao: '',
    usarIA: true,
    legendas: true,
    efeitos: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setEtapaAtual(0);

    // Simular processo de criação
    for (let i = 0; i < etapas.length; i++) {
      setEtapaAtual(i);
      setProgress(((i + 1) / etapas.length) * 100);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    toast({
      title: 'Vídeo criado com sucesso!',
      description: 'Seu vídeo foi processado e está pronto.',
    });

    setIsLoading(false);
    navigate('/historico');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Criar Vídeo</h1>
          <p className="text-gray-500">Crie um novo vídeo Pokémon + RPG</p>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Vídeo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                placeholder="Ex: Charizard - O Dragão de Fogo Lendário"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tema">Tema Pokémon</Label>
              <Select
                value={formData.tema}
                onValueChange={(value) =>
                  setFormData({ ...formData, tema: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um Pokémon" />
                </SelectTrigger>
                <SelectContent>
                  {temasPokemon.map((tema) => (
                    <SelectItem key={tema} value={tema}>
                      {tema}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                disabled={isLoading}
                rows={4}
                required
              />
            </div>

            <div className="space-y-4">
              <Label>Opções Avançadas</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="usarIA"
                    checked={formData.usarIA}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, usarIA: checked as boolean })
                    }
                    disabled={isLoading}
                  />
                  <Label htmlFor="usarIA" className="font-normal">
                    Usar IA para gerar imagens (DALL-E)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="legendas"
                    checked={formData.legendas}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, legendas: checked as boolean })
                    }
                    disabled={isLoading}
                  />
                  <Label htmlFor="legendas" className="font-normal">
                    Adicionar legendas sincronizadas
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="efeitos"
                    checked={formData.efeitos}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, efeitos: checked as boolean })
                    }
                    disabled={isLoading}
                  />
                  <Label htmlFor="efeitos" className="font-normal">
                    Usar efeitos dinâmicos (zoom, pan, partículas)
                  </Label>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">
                    {etapas[etapaAtual]?.nome}
                  </span>
                  <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-500">
                  {etapas[etapaAtual]?.descricao}
                </p>
                <div className="flex gap-2">
                  {etapas.map((etapa, index) => (
                    <div
                      key={etapa.id}
                      className={`h-2 flex-1 rounded-full ${
                        index <= etapaAtual ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.titulo || !formData.tema}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Gerar Vídeo
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
