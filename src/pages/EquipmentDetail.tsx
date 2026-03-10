import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import { equipmentList, auditEvents } from "@/data/mockData";
import { useState } from "react";

const typeLabels: Record<string, string> = {
  creation: "Création",
  maintenance: "Maintenance",
  transfer: "Transfert",
  audit: "Audit",
  decommission: "Décommission",
};

const EquipmentDetail = () => {
  const { id } = useParams();
  const equipment = equipmentList.find((e) => e.id === id);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  if (!equipment) {
    return (
      <AppLayout title="Équipement introuvable">
        <p className="text-muted-foreground">
          Aucun équipement trouvé avec l'identifiant <span className="font-mono">{id}</span>.
        </p>
        <Link to="/equipements" className="text-sm text-primary hover:underline mt-2 inline-block">
          Retour à la liste
        </Link>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={equipment.name}>
      {/* Passport header */}
      <div className="bg-card border border-border rounded-md mb-section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Photo placeholder */}
          <div className="border-b md:border-b-0 md:border-r border-border bg-muted flex items-center justify-center min-h-[200px] md:min-h-[280px]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-3 border-2 border-dashed border-border rounded-md flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Photo</span>
              </div>
              <div className="w-20 h-20 mx-auto border border-border rounded-sm flex items-center justify-center bg-card">
                <span className="text-xs text-muted-foreground font-mono">QR</span>
              </div>
            </div>
          </div>

          {/* Core metadata */}
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Identifiant</p>
                <p className="font-mono text-lg font-semibold text-foreground">{equipment.id}</p>
              </div>
              <StatusBadge status={equipment.status} />
            </div>

            <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Catégorie</p>
                <p className="text-sm text-foreground">{equipment.category}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Emplacement</p>
                <p className="text-sm text-foreground">{equipment.location}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">N° de série</p>
                <p className="text-sm font-mono text-foreground">{equipment.serialNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Date d'acquisition</p>
                <p className="text-sm font-mono text-foreground">{new Date(equipment.acquisitionDate).toLocaleDateString("fr-FR")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Valeur</p>
                <p className="text-sm font-mono font-semibold text-foreground">{equipment.value.toLocaleString("fr-FR")} €</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-border mb-section" />

      {/* Audit Trail */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-6">Historique d'audit</h3>
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-0">
            {auditEvents.map((event) => (
              <div
                key={event.id}
                className={`relative pl-6 py-3 rounded-md transition-colors cursor-default ${
                  hoveredEvent === event.id ? "bg-muted" : ""
                }`}
                onMouseEnter={() => setHoveredEvent(event.id)}
                onMouseLeave={() => setHoveredEvent(null)}
                onClick={() => setHoveredEvent(hoveredEvent === event.id ? null : event.id)}
              >
                {/* Node */}
                <div
                  className={`absolute left-[-17px] top-[18px] w-3 h-3 rounded-full border-2 transition-colors ${
                    hoveredEvent === event.id
                      ? "border-primary bg-primary"
                      : "border-border bg-card"
                  }`}
                />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{event.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {typeLabels[event.type]} — {event.user}
                    </p>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(event.date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EquipmentDetail;
