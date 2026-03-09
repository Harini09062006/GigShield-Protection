import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck, LogOut, ArrowLeft } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  isWorker?: boolean;
}

export function Layout({ children, isWorker }: LayoutProps) {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("gigshield_worker_id");
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 glass-card rounded-none border-t-0 border-x-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-gradient-to-br from-primary to-indigo-600 p-2 rounded-xl text-white shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
              <ShieldCheck size={24} strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              Gig<span className="text-primary">Shield</span>
            </span>
          </Link>
          
          <nav className="flex items-center gap-4">
            {location !== "/" && !isWorker && (
              <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={16} /> Back Home
              </Link>
            )}
            
            {isWorker && (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
              >
                <LogOut size={16} />
                Switch Account
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border/50">
        <p>© {new Date().getFullYear()} GigShield Parametric Insurance. Built for delivery partners.</p>
      </footer>
    </div>
  );
}
