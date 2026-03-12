import { AlertTriangle, Wrench, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

interface AlertItem {
  id: string;
  type: "warranty" | "maintenance" | "out_of_service";
  name: string;
  detail: string;
  equipmentId: string;
}

const iconMap = {
  warranty: <AlertTriangle className="h-4 w-4 text-accent shrink-0" />,
  maintenance: <Wrench className="h-4 w-4 text-primary shrink-0" />,
  out_of_service: <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />,
};

const AlertsPanel = ({ alerts }: { alerts: AlertItem[] }) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-foreground">Alertes</h3>
      {alerts.length > 0 && (
        <span className="bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-2 py-0.5">
          {alerts.length}
        </span>
      )}
    </div>
    {alerts.length > 0 ? (
      <div className="space-y-1 max-h-[320px] overflow-y-auto">
        {alerts.map((a) => (
          <Link
            key={a.id}
            to={`/equipment/${a.equipmentId}`}
            className="flex items-start gap-2 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors border-b border-border last:border-0"
          >
            {iconMap[a.type]}
            <div className="min-w-0">
              <p className="text-sm text-foreground truncate">{a.name}</p>
              <p className="text-xs text-muted-foreground">{a.detail}</p>
            </div>
          </Link>
        ))}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground py-8 text-center">Aucune alerte 🎉</p>
    )}
  </div>
);

export default AlertsPanel;
export type { AlertItem };
