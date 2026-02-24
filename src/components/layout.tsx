import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  CalendarClock,
  Settings,
  Terminal,
  Menu,
  Video,
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
  { name: 'Teste de Módulos', href: '/teste', icon: Video },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const NavLinks = () => (
    <>
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
          <Video className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">RPmon</span>
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
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
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
            className="fixed left-4 top-4 z-50"
          >
            <Menu className="h-6 w-6" />
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
