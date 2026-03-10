interface MetricCardProps {
  label: string;
  value: string | number;
  detail?: string;
}

const MetricCard = ({ label, value, detail }: MetricCardProps) => (
  <div className="bg-card border border-border rounded-md p-5">
    <p className="text-sm text-muted-foreground mb-1">{label}</p>
    <p className="text-2xl font-semibold font-mono text-foreground">{value}</p>
    {detail && <p className="text-xs text-muted-foreground mt-1">{detail}</p>}
  </div>
);

export default MetricCard;
