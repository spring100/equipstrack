import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Activity } from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  created_at: string;
  details?: any;
}

const actionLabels: Record<string, string> = {
  create: "a créé",
  update: "a modifié",
  delete: "a supprimé",
  transfer: "a transféré",
  maintenance: "a planifié une maintenance pour",
};

const ActivityFeed = ({ activities }: { activities: ActivityItem[] }) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="flex items-center gap-2 mb-3">
      <Activity className="h-4 w-4 text-muted-foreground" />
      <h3 className="text-sm font-semibold text-foreground">Activité récente</h3>
    </div>
    {activities.length > 0 ? (
      <div className="space-y-1 max-h-[320px] overflow-y-auto">
        {activities.map((a) => (
          <div
            key={a.id}
            className="flex items-start justify-between py-2 px-2 rounded-md hover:bg-muted/50 transition-colors border-b border-border last:border-0"
          >
            <div className="flex items-start gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-primary">
                  {(a.action?.[0] || "?").toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{actionLabels[a.action] || a.action}</span>
                  {a.entity_type && (
                    <span className="text-muted-foreground"> · {a.entity_type}</span>
                  )}
                </p>
                {a.details?.name && (
                  <p className="text-xs text-muted-foreground truncate">{a.details.name}</p>
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground shrink-0 ml-2">
              {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: fr })}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground py-8 text-center">Aucune activité récente</p>
    )}
  </div>
);

export default ActivityFeed;
