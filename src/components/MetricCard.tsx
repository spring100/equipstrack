import { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
}

const MetricCard = ({ label, value, detail, icon }: MetricCardProps) => (
  <div className="bg-card border border-border rounded-md p-5">
    <div className="flex items-center justify-between mb-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      {icon}
    </div>
    <p className="text-2xl font-semibold font-mono text-foreground">{value}</p>
    {detail && <p className="text-xs text-muted-foreground mt-1">{detail}</p>}
  </div>
);

export default MetricCard;
