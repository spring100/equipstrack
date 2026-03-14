import { Link, useLocation } from "react-router-dom";

const navItems = [
  { path: "/", label: "Tableau de bord" },
  { path: "/equipements", label: "Équipements" },
  { path: "/categories", label: "Catégories" },
  { path: "/emplacements", label: "Emplacements" },
  { path: "/audits", label: "Audits" },
  { path: "/rapports", label: "Rapports" },
  { path: "/parametres", label: "Paramètres" },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AppLayout = ({ children, title }: AppLayoutProps) => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card">
        <div className="px-6 py-6 border-b border-border flex items-center gap-2">
          <img src="/equipstrack-logo.png" alt="Equipstrack" className="h-8 w-8 object-contain" />
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Equipstrack
          </h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground">Organisation Demo</p>
          <p className="text-xs text-muted-foreground">v1.0.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <img src="/equipstrack-logo.png" alt="Equipstrack" className="h-7 w-7 object-contain" />
          <h1 className="text-lg font-semibold text-foreground">Equipstrack</h1>
        </header>

        {/* Page header */}
        <div className="px-6 py-6 lg:px-8">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </div>

        {/* Page content */}
        <div className="flex-1 px-6 pb-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
};

export default AppLayout;
