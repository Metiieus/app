import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wand2, Loader2, Zap, Music, Type, Sparkles, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const API = 'http://localhost:3001';

const nichosTikTok = [
  { value: 'motivacional', label: '💪 Motivacional', desc: 'Frases e histórias inspiradoras' },
  { value: 'curiosidades', label: '🤯 Curiosidades', desc: 'Fatos surpreendentes' },
  { value: 'humor', label: '😂 Humor', desc: 'Conteúdo engraçado e viral' },
  { value: 'educativo', label: '📚 Educativo', desc: 'Aprenda algo novo' },
  { value: 'lifestyle', label: '✨ Lifestyle', desc: 'Estilo de vida e bem-estar' },
  { value: 'financas', label: '💰 Finanças', desc: 'Dicas de dinheiro e investimento' },
  { value: 'tecnologia', label: '🤖 Tecnologia', desc: 'Novidades tech e IA' },
  { value: 'saude', label: '🏃 Saúde & Fitness', desc: 'Dicas de saúde e exercícios' },
  { value: 'receitas', label: '🍕 Receitas', desc: 'Comidas e bebidas' },
  { value: 'relacionamentos', label: '❤️ Relacionamentos', desc: 'Amor e conexões' },
  { value: 'negocios', label: '📈 Negócios', desc: 'Empreendedorismo e marketing' },
  { value: 'espiritualidade', label: '🧘 Espiritualidade', desc: 'Meditação e autoconhecimento' },
];

const duracoes = [
  { value: '15', label: '15 segundos', desc: 'Ultra viral' },
  { value: '30', label: '30 segundos', desc: 'Ideal para engajamento' },
  { value: '60', label: '60 segundos', desc: 'Conteúdo completo' },
];

const estilosNarracao = [
  { value: 'energetico', label: '⚡ Enérgico', desc: 'Rápido e animado' },
  { value: 'calmo', label: '🌊 Calmo', desc: 'Suave e reflexivo' },
  { value: 'dramatico', label: '🎭 Dramático', desc: 'Impactante e intenso' },
  { value: 'informativo', label: '📢 Informativo', desc: 'Claro e direto' },
];

interface LogEntry {
  id: string;
  tipo: string;
  etapa: string;
  mensagem: string;
  criadoEm: string;
}

interface PipelineStatus {
  status: string;
  progresso: number;
  logs: LogEntry[];
  videoUrl?: string;
  thumbnailUrl?: string;
}

export function CriarVideoPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    nicho: '',
    tema: '',
    duracao: '30',
    estiloNarracao: 'energetico',
    hookInicial: '',
    legendasAnimadas: true,
    musicaTrending: true,
    efeitos: true,
    autoPublicar: false,
  });

  // Polling do status do pipeline
  useEffect(() => {
    if (!videoId) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API}/api/pipeline/${videoId}/status`, {
          headers: { 'x-user-id': 'dev-user-001' },
        });
        if (!res.ok) return;
        const data: PipelineStatus = await res.json();
        setPipelineStatus(data);

        if (data.status === 'concluido' || data.status === 'publicado') {
          clearInterval(pollingRef.current!);
          setIsLoading(false);
          toast({
            title: '🎉 Vídeo criado com sucesso!',
            description: 'Acesse o Histórico para assistir e baixar.',
          });
        } else if (data.status === 'erro') {
          clearInterval(pollingRef.current!);
          setIsLoading(false);
          toast({
            title: '❌ Erro ao gerar vídeo',
            description: 'Verifique os logs abaixo para mais detalhes.',
            variant: 'destructive',
          });
        }
      } catch (e) {
        console.error('Polling erro:', e);
      }
    };

    pollingRef.current = setInterval(poll, 2000);
    poll(); // primeira chamada imediata
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [videoId]);

  // Auto-scroll nos logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pipelineStatus?.logs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.nicho || !formData.tema) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setPipelineStatus(null);

    try {
      const res = await fetch(`${API}/api/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'dev-user-001' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar vídeo');
      }

      const data = await res.json();
      setVideoId(data.videoId);
      toast({ title: '🚀 Pipeline iniciado!', description: 'Gerando seu vídeo TikTok...' });
    } catch (e) {
      setIsLoading(false);
      toast({ title: '❌ Erro', description: String(e), variant: 'destructive' });
    }
  };

  const logIcon = (tipo: string) => {
    if (tipo === 'sucesso') return <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />;
    if (tipo === 'erro') return <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />;
    if (tipo === 'aviso') return <AlertCircle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />;
    return <Loader2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 animate-spin" />;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl" disabled={isLoading}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Criar Vídeo TikTok</h1>
          <p className="text-gray-500 text-sm">Gere conteúdo viral com IA em segundos</p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Nicho */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#ff0050]" />
              Nicho do Conteúdo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {nichosTikTok.map((nicho) => (
                <button
                  key={nicho.value}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setFormData({ ...formData, nicho: nicho.value })}
                  className={`rounded-xl border p-3 text-left transition-all duration-200 ${
                    formData.nicho === nicho.value
                      ? 'border-[#ff0050] bg-[#ff0050]/5 shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900">{nicho.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{nicho.desc}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Informações do Vídeo */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Type className="h-4 w-4 text-[#ff0050]" />
              Informações do Vídeo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo" className="font-semibold text-gray-700">Título</Label>
              <Input
                id="titulo"
                placeholder="Ex: 5 hábitos que vão mudar sua vida"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                disabled={isLoading}
                required
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tema" className="font-semibold text-gray-700">Tema / Assunto Principal</Label>
              <Textarea
                id="tema"
                placeholder="Descreva o tema do vídeo. Ex: Mostrar como acordar cedo transforma a produtividade, com dicas práticas e motivação..."
                value={formData.tema}
                onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                disabled={isLoading}
                rows={3}
                required
                className="rounded-xl border-gray-200 resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hookInicial" className="font-semibold text-gray-700">
                Hook Inicial <span className="text-gray-400 font-normal">(opcional)</span>
              </Label>
              <Input
                id="hookInicial"
                placeholder="Ex: Você sabia que 90% das pessoas fazem isso errado?"
                value={formData.hookInicial}
                onChange={(e) => setFormData({ ...formData, hookInicial: e.target.value })}
                disabled={isLoading}
                className="rounded-xl border-gray-200"
              />
              <p className="text-xs text-gray-500">A frase de abertura que prende a atenção nos primeiros 3 segundos</p>
            </div>
          </CardContent>
        </Card>

        {/* Duração e Narração */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#ff0050]" />
                Duração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {duracoes.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setFormData({ ...formData, duracao: d.value })}
                    className={`w-full rounded-xl border p-3 text-left transition-all duration-200 ${
                      formData.duracao === d.value ? 'border-[#ff0050] bg-[#ff0050]/5' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">{d.label}</span>
                      <Badge variant="secondary" className="text-xs">{d.desc}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Music className="h-4 w-4 text-[#ff0050]" />
                Estilo de Narração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {estilosNarracao.map((e) => (
                  <button
                    key={e.value}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setFormData({ ...formData, estiloNarracao: e.value })}
                    className={`w-full rounded-xl border p-3 text-left transition-all duration-200 ${
                      formData.estiloNarracao === e.value ? 'border-[#ff0050] bg-[#ff0050]/5' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">{e.label}</span>
                      <span className="text-xs text-gray-500">{e.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Opções */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#ff0050]" />
              Opções de Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { id: 'legendasAnimadas', label: '💬 Legendas Animadas', desc: 'Estilo CapCut viral' },
                { id: 'musicaTrending', label: '🎵 Música Trending', desc: 'Sons em alta no TikTok' },
                { id: 'efeitos', label: '✨ Efeitos Dinâmicos', desc: 'Zoom, pan e transições' },
                { id: 'autoPublicar', label: '🚀 Auto-publicar', desc: 'Postar automaticamente no TikTok' },
              ].map((opcao) => (
                <div
                  key={opcao.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
                    formData[opcao.id as keyof typeof formData] ? 'border-[#ff0050]/30 bg-[#ff0050]/5' : 'border-gray-100 bg-white'
                  }`}
                  onClick={() => !isLoading && setFormData({ ...formData, [opcao.id]: !formData[opcao.id as keyof typeof formData] })}
                >
                  <Checkbox
                    id={opcao.id}
                    checked={formData[opcao.id as keyof typeof formData] as boolean}
                    onCheckedChange={(checked) => setFormData({ ...formData, [opcao.id]: checked as boolean })}
                    disabled={isLoading}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor={opcao.id} className="font-semibold text-sm text-gray-900 cursor-pointer">{opcao.label}</Label>
                    <p className="text-xs text-gray-500">{opcao.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progresso em tempo real */}
        {(isLoading || pipelineStatus) && (
          <Card className="border-0 shadow-sm bg-gradient-to-br from-[#ff0050]/5 to-[#00f2ea]/5">
            <CardContent className="pt-5 pb-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    {pipelineStatus?.status === 'concluido' ? '✅ Vídeo pronto!' :
                     pipelineStatus?.status === 'erro' ? '❌ Erro no pipeline' :
                     '⚙️ Gerando vídeo...'}
                  </span>
                  <span className="text-sm font-bold text-[#ff0050]">{pipelineStatus?.progresso ?? 0}%</span>
                </div>
                <Progress value={pipelineStatus?.progresso ?? 0} className="h-2.5 bg-gray-100" />

                {/* Logs em tempo real */}
                {pipelineStatus?.logs && pipelineStatus.logs.length > 0 && (
                  <div className="bg-gray-900 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1.5">
                    {[...pipelineStatus.logs].reverse().map((log) => (
                      <div key={log.id} className="flex items-start gap-2 text-xs">
                        {logIcon(log.tipo)}
                        <span className={`${
                          log.tipo === 'sucesso' ? 'text-green-400' :
                          log.tipo === 'erro' ? 'text-red-400' :
                          log.tipo === 'aviso' ? 'text-yellow-400' :
                          'text-blue-300'
                        }`}>{log.mensagem}</span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}

                {/* Preview do vídeo quando pronto */}
                {pipelineStatus?.status === 'concluido' && pipelineStatus.videoUrl && (
                  <div className="flex gap-4 items-start pt-2">
                    <div className="aspect-[9/16] w-[120px] rounded-xl overflow-hidden bg-black border border-gray-700 flex-shrink-0">
                      <video
                        src={`${API}${pipelineStatus.videoUrl}`}
                        controls
                        className="w-full h-full object-contain"
                        poster={pipelineStatus.thumbnailUrl ? `${API}${pipelineStatus.thumbnailUrl}` : undefined}
                      />
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                      <a
                        href={`${API}/download/${pipelineStatus.videoUrl.split('/').pop()}`}
                        download
                        className="inline-flex items-center gap-2 bg-[#ff0050] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-90"
                      >
                        ⬇️ Baixar MP4
                      </a>
                      <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => navigate('/historico')}>
                        Ver no Histórico
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/')} disabled={isLoading} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.titulo || !formData.nicho || !formData.tema}
            className="flex-1 bg-gradient-to-r from-[#ff0050] to-[#ff4d7d] hover:opacity-90 text-white font-bold shadow-lg shadow-[#ff0050]/20 rounded-xl h-11"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando vídeo viral...</>
            ) : (
              <><Wand2 className="mr-2 h-4 w-4" />Gerar Vídeo TikTok</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
