import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TRPCProvider } from './lib/trpc-provider';
import { Layout } from './components/layout';
import { HomePage } from './pages/home';
import { CriarVideoPage } from './pages/criar-video';
import { HistoricoPage } from './pages/historico';
import { AgendadorPage } from './pages/agendador';
import { PainelControlePage } from './pages/painel-controle';
import { ConfiguracoesPage } from './pages/configuracoes';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <TRPCProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/criar" element={<CriarVideoPage />} />
            <Route path="/historico" element={<HistoricoPage />} />
            <Route path="/agendador" element={<AgendadorPage />} />
            <Route path="/painel" element={<PainelControlePage />} />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          </Routes>
        </Layout>
        <Toaster />
      </BrowserRouter>
    </TRPCProvider>
  );
}

export default App;
