import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, Package, DollarSign, ClipboardCheck, Wrench } from "lucide-react";

const COLORS = [
  "hsl(214, 59%, 26%)",
  "hsl(35, 99%, 47%)",
  "hsl(142, 76%, 36%)",
  "hsl(262, 52%, 47%)",
  "hsl(0, 72%, 51%)",
  "hsl(190, 80%, 42%)",
];

const Dashboard = () => {
  const { profile } = useAuth();
  const orgId = profile?.org_id;

  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("equipment")
        .select("id, name, operational_status, purchase_price, current_value, category_id, site_id, warranty_expiry, next_maintenance, categories(name), sites(name)")
        .eq("org_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activity_log", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("activity_log")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: maintenanceDue = [] } = useQuery({
    queryKey: ["maintenance_due", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("maintenance_orders")
        .select("id, description, scheduled_date, equipment(name)")
        .eq("org_id", orgId)
        .eq("status", "planifie")
        .order("scheduled_date", { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!orgId,
  });

  const totalEquipment = equipment.length;
  const totalValue = equipment.reduce((sum: number, e: any) => sum + (Number(e.current_value) || Number(e.purchase_price) || 0), 0);
  const inMaintenance = equipment.filter((e: any) => e.operational_status === "en_maintenance").length;

  // Warranty expiring in 30 days
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const warrantyAlerts = equipment.filter((e: any) => {
    if (!e.warranty_expiry) return false;
    const exp = new Date(e.warranty_expiry);
    return exp <= thirtyDays && exp >= new Date();
  });

  // Category distribution
  const categoryMap: Record<string, number> = {};
  equipment.forEach((e: any) => {
    const cat = (e.categories as any)?.name || "Non classé";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // Site distribution
  const siteMap: Record<string, number> = {};
  equipment.forEach((e: any) => {
    const site = (e.sites as any)?.name || "Non assigné";
    siteMap[site] = (siteMap[site] || 0) + 1;
  });
  const siteData = Object.entries(siteMap).map(([name, value]) => ({ name, value }));

  return (
    <DashboardLayout
      title="Tableau de bord"
      breadcrumb={[{ label: "Tableau de bord" }]}
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total équipements"
          value={totalEquipment}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          label="Valeur totale"
          value={`${totalValue.toLocaleString("fr-FR")} €`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          label="En maintenance"
          value={inMaintenance}
          icon={<Wrench className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          label="Alertes garantie"
          value={warrantyAlerts.length}
          detail={warrantyAlerts.length > 0 ? "Expirent sous 30j" : "Aucune"}
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Pie chart */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par catégorie</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">Aucun équipement</p>
          )}
        </div>

        {/* Bar chart */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Équipements par site</h3>
          {siteData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={siteData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(214, 59%, 26%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">Aucun site</p>
          )}
        </div>
      </div>

      {/* Bottom sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity feed */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Dernières activités</h3>
          {activities.length > 0 ? (
            <div className="space-y-2">
              {activities.map((a: any) => (
                <div key={a.id} className="flex items-start justify-between py-1.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm text-foreground">{a.action}</p>
                    <p className="text-xs text-muted-foreground">{a.entity_type}</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {new Date(a.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Aucune activité récente</p>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Alertes</h3>
          {warrantyAlerts.length > 0 ? (
            <div className="space-y-2">
              {warrantyAlerts.map((e: any) => (
                <div key={e.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                  <AlertTriangle className="h-4 w-4 text-accent shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{e.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Garantie expire le {new Date(e.warranty_expiry).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Aucune alerte</p>
          )}

          {maintenanceDue.length > 0 && (
            <>
              <h4 className="text-xs font-semibold text-muted-foreground mt-4 mb-2">Maintenances planifiées</h4>
              {maintenanceDue.map((m: any) => (
                <div key={m.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                  <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{(m.equipment as any)?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Planifiée le {m.scheduled_date ? new Date(m.scheduled_date).toLocaleDateString("fr-FR") : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
