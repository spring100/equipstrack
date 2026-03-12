import { useEffect, useRef, useState } from "react";
import { Package, DollarSign, AlertTriangle, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPI {
  label: string;
  value: number;
  formatted: string;
  detail?: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
}

const AnimatedNumber = ({ target, formatted }: { target: number; formatted: string }) => {
  const [display, setDisplay] = useState("0");
  const ref = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setDisplay(formatted); return; }
    const duration = 800;
    const start = ref.current;
    const diff = target - start;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      ref.current = current;

      if (formatted.includes("€")) {
        setDisplay(`${current.toLocaleString("fr-FR")} €`);
      } else {
        setDisplay(String(current));
      }

      if (progress < 1) requestAnimationFrame(tick);
      else setDisplay(formatted);
    };
    requestAnimationFrame(tick);
  }, [target, formatted]);

  return <span>{display}</span>;
};

interface KPICardsProps {
  totalEquipment: number;
  totalValue: number;
  alertCount: number;
  activeAudits: number;
}

const KPICards = ({ totalEquipment, totalValue, alertCount, activeAudits }: KPICardsProps) => {
  const kpis: KPI[] = [
    {
      label: "Total équipements",
      value: totalEquipment,
      formatted: String(totalEquipment),
      icon: <Package className="h-4 w-4" />,
    },
    {
      label: "Valeur totale",
      value: totalValue,
      formatted: `${totalValue.toLocaleString("fr-FR")} €`,
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: "Alertes actives",
      value: alertCount,
      formatted: String(alertCount),
      detail: alertCount > 0 ? "Requièrent attention" : "Aucune",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      label: "Audits en cours",
      value: activeAudits,
      formatted: String(activeAudits),
      icon: <ClipboardCheck className="h-4 w-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-card border border-border rounded-lg p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <div className={cn(
              "p-1.5 rounded-md",
              kpi.label === "Alertes actives" && kpi.value > 0
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            )}>
              {kpi.icon}
            </div>
          </div>
          <p className="text-2xl font-semibold font-mono text-foreground">
            <AnimatedNumber target={kpi.value} formatted={kpi.formatted} />
          </p>
          {kpi.detail && <p className="text-xs text-muted-foreground mt-1">{kpi.detail}</p>}
        </div>
      ))}
    </div>
  );
};

export default KPICards;
