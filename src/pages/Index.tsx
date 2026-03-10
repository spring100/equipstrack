import AppLayout from "@/components/AppLayout";
import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import { equipmentList } from "@/data/mockData";
import { Link } from "react-router-dom";

const Index = () => {
  const activeCount = equipmentList.filter((e) => e.status === "active").length;
  const maintenanceCount = equipmentList.filter((e) => e.status === "maintenance").length;
  const totalValue = equipmentList.reduce((sum, e) => sum + e.value, 0);

  return (
    <AppLayout title="Tableau de bord">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-section">
        <MetricCard label="Total équipements" value={equipmentList.length} />
        <MetricCard label="En service" value={activeCount} detail={`${Math.round((activeCount / equipmentList.length) * 100)}% du parc`} />
        <MetricCard label="En maintenance" value={maintenanceCount} />
        <MetricCard label="Valeur totale" value={`${totalValue.toLocaleString("fr-FR")} €`} />
      </div>

      {/* Separator */}
      <div className="border-t border-border mb-section" />

      {/* Recent equipment */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Équipements récents</h3>
          <Link to="/equipements" className="text-sm font-medium text-primary hover:underline">
            Voir tout
          </Link>
        </div>
        <div className="bg-card border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Emplacement</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
              </tr>
            </thead>
            <tbody>
              {equipmentList.slice(0, 5).map((eq) => (
                <tr key={eq.id} className="border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{eq.id}</td>
                  <td className="px-4 py-3">
                    <Link to={`/equipements/${eq.id}`} className="text-primary hover:underline">
                      {eq.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{eq.location}</td>
                  <td className="px-4 py-3"><StatusBadge status={eq.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
