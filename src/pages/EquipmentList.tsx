import AppLayout from "@/components/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import { equipmentList } from "@/data/mockData";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const EquipmentList = () => {
  return (
    <AppLayout title="Équipements">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {equipmentList.length} équipement{equipmentList.length > 1 ? "s" : ""}
        </p>
        <Button size="sm">+ Ajouter un équipement</Button>
      </div>

      <div className="bg-card border border-border rounded-md overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nom</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Catégorie</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Emplacement</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° série</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valeur</th>
            </tr>
          </thead>
          <tbody>
            {equipmentList.map((eq) => (
              <tr key={eq.id} className="border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">{eq.id}</td>
                <td className="px-4 py-3">
                  <Link to={`/equipements/${eq.id}`} className="text-primary hover:underline">
                    {eq.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{eq.category}</td>
                <td className="px-4 py-3 text-muted-foreground">{eq.location}</td>
                <td className="px-4 py-3 font-mono text-xs">{eq.serialNumber}</td>
                <td className="px-4 py-3"><StatusBadge status={eq.status} /></td>
                <td className="px-4 py-3 text-right font-mono">{eq.value.toLocaleString("fr-FR")} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

export default EquipmentList;
