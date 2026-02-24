import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  CalendarClock,
  Settings,
  Terminal,
  Menu,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Criar Vídeo', href: '/criar', icon: PlusCircle },
  { name: 'Histórico', href: '/historico', icon: History },
  { name: 'Agendador', href: '/agendador', icon: CalendarClock },
  { name: 'Painel de Controle', href: '/painel', icon: Terminal },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const NavLinks = () => (
    <>
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff0050] to-[#00f2ea]">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-xl font-black text-gray-900 tracking-tight">TikFactory</span>
          <p className="text-[10px] text-gray-400 font-medium -mt-0.5">Máquina de Vídeos</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-[#ff0050]/10 to-[#00f2ea]/10 text-[#ff0050] border border-[#ff0050]/20'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="rounded-xl bg-gradient-to-br from-[#ff0050]/5 to-[#00f2ea]/5 border border-[#ff0050]/10 p-3">
          <p className="text-xs font-semibold text-gray-700">🚀 Modo Automático</p>
          <p className="text-xs text-gray-500 mt-0.5">Vídeos sendo gerados 24/7</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        <NavLinks />
      </aside>

      {/* Sidebar Mobile */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-50 bg-white shadow-md rounded-xl"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <NavLinks />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
