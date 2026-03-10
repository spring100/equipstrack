const statusConfig = {
  active: { label: "En service", className: "bg-status-active/10 text-status-active border-status-active/20" },
  maintenance: { label: "Maintenance", className: "bg-status-maintenance/10 text-status-maintenance border-status-maintenance/20" },
  storage: { label: "En stock", className: "bg-status-storage/10 text-status-storage border-status-storage/20" },
  decommissioned: { label: "Décommissionné", className: "bg-status-decommissioned/10 text-status-decommissioned border-status-decommissioned/20" },
} as const;

type Status = keyof typeof statusConfig;

const StatusBadge = ({ status }: { status: Status }) => {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-sm ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
export type { Status };
