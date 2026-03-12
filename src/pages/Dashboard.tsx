import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeEquipment } from "@/hooks/useRealtimeEquipment";
import KPICards from "@/components/dashboard/KPICards";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import AlertsPanel, { type AlertItem } from "@/components/dashboard/AlertsPanel";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { format, subMonths, addDays, isBefore, isAfter } from "date-fns";
import { fr } from "date-fns/locale";

const Dashboard = () => {
  const { profile } = useAuth();
  const orgId = profile?.org_id;

  // Enable realtime subscriptions
  useRealtimeEquipment(orgId);

  const { data: equipment = [] } = useQuery({
    queryKey: ["dashboard-equipment", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("equipment")
        .select("id, name, operational_status, purchase_price, current_value, category_id, site_id, warranty_expiry, next_maintenance, updated_at, categories(name), sites(name)")
        .eq("org_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["dashboard-activity", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("activity_log")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(15);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: activeAudits = 0 } = useQuery({
    queryKey: ["dashboard-audits", orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await supabase
        .from("audit_sessions")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("status", "en_cours");
      return count || 0;
    },
    enabled: !!orgId,
  });

  const { data: maintenanceOrders = [] } = useQuery({
    queryKey: ["dashboard-maintenance", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("maintenance_orders")
        .select("id, status, scheduled_date, completed_date")
        .eq("org_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  // KPI values
  const totalEquipment = equipment.length;
  const totalValue = equipment.reduce((s: number, e: any) => s + (Number(e.current_value) || Number(e.purchase_price) || 0), 0);

  // Alerts
  const now = new Date();
  const in30d = addDays(now, 30);
  const in7d = addDays(now, 7);
  const sevenDaysAgo = addDays(now, -7);

  const alerts = useMemo<AlertItem[]>(() => {
    const result: AlertItem[] = [];
    equipment.forEach((e: any) => {
      if (e.warranty_expiry) {
        const exp = new Date(e.warranty_expiry);
        if (isAfter(exp, now) && isBefore(exp, in30d)) {
          result.push({
            id: `w-${e.id}`,
            type: "warranty",
            name: e.name,
            detail: `Garantie expire le ${format(exp, "dd/MM/yyyy")}`,
            equipmentId: e.id,
          });
        }
      }
      if (e.next_maintenance) {
        const nm = new Date(e.next_maintenance);
        if (isBefore(nm, in7d)) {
          result.push({
            id: `m-${e.id}`,
            type: "maintenance",
            name: e.name,
            detail: `Maintenance due le ${format(nm, "dd/MM/yyyy")}`,
            equipmentId: e.id,
          });
        }
      }
      if (e.operational_status === "hors_service" && e.updated_at) {
        const upd = new Date(e.updated_at);
        if (isBefore(upd, sevenDaysAgo)) {
          result.push({
            id: `hs-${e.id}`,
            type: "out_of_service",
            name: e.name,
            detail: "Hors service depuis plus de 7 jours",
            equipmentId: e.id,
          });
        }
      }
    });
    return result;
  }, [equipment]);

  // Category chart data (top 6 + Others)
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    equipment.forEach((e: any) => {
      const cat = (e.categories as any)?.name || "Non classé";
      map[cat] = (map[cat] || 0) + 1;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    if (sorted.length <= 7) return sorted.map(([name, value]) => ({ name, value }));
    const top6 = sorted.slice(0, 6);
    const othersValue = sorted.slice(6).reduce((s, [, v]) => s + v, 0);
    return [...top6.map(([name, value]) => ({ name, value })), { name: "Autres", value: othersValue }];
  }, [equipment]);

  // Site chart data
  const siteData = useMemo(() => {
    const map: Record<string, number> = {};
    equipment.forEach((e: any) => {
      const site = (e.sites as any)?.name || "Non assigné";
      map[site] = (map[site] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [equipment]);

  // Maintenance chart: 6 months
  const maintenanceChartData = useMemo(() => {
    const months: { month: string; planifiées: number; terminées: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM yy", { locale: fr });
      const planned = maintenanceOrders.filter((m: any) => m.scheduled_date?.startsWith(key)).length;
      const completed = maintenanceOrders.filter((m: any) => m.completed_date?.startsWith(key)).length;
      months.push({ month: label, planifiées: planned, terminées: completed });
    }
    return months;
  }, [maintenanceOrders]);

  return (
    <DashboardLayout title="Tableau de bord" breadcrumb={[{ label: "Tableau de bord" }]}>
      <KPICards
        totalEquipment={totalEquipment}
        totalValue={totalValue}
        alertCount={alerts.length}
        activeAudits={activeAudits}
      />

      <DashboardCharts
        categoryData={categoryData}
        siteData={siteData}
        maintenanceData={maintenanceChartData}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityFeed activities={activities} />
        <AlertsPanel alerts={alerts} />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
