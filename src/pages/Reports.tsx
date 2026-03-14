import { useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Package, DollarSign, Wrench, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

const Reports = () => {
  const { profile, orgInfo } = useAuth();
  const orgId = orgInfo?.orgId || profile?.org_id;

  useEffect(() => {
    document.title = "Rapports — Equipstrack";
  }, []);

  const { data: equipment = [] } = useQuery({
    queryKey: ["report-equipment", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("equipment")
        .select("id, name, item_number, purchase_price, current_value, operational_status, condition, category_id, site_id, categories(name), sites(name)")
        .eq("org_id", orgId!);
      return data || [];
    },
  });

  const { data: maintenanceOrders = [] } = useQuery({
    queryKey: ["report-maintenance", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("maintenance_orders")
        .select("id, status, type, estimated_cost, actual_cost")
        .eq("org_id", orgId!);
      return data || [];
    },
  });

  // Stats
  const totalPurchase = equipment.reduce((s: number, e: any) => s + (Number(e.purchase_price) || 0), 0);
  const totalCurrent = equipment.reduce((s: number, e: any) => s + (Number(e.current_value) || Number(e.purchase_price) || 0), 0);
  const totalDepreciation = totalPurchase - totalCurrent;
  const maintenanceCost = maintenanceOrders.reduce((s: number, m: any) => s + (Number(m.actual_cost) || Number(m.estimated_cost) || 0), 0);

  // By status
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    equipment.forEach((e: any) => {
      const s = e.operational_status || "inconnu";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name === "en_service" ? "En service" : name === "hors_service" ? "Hors service" : name === "en_maintenance" ? "En maintenance" : name, value }));
  }, [equipment]);

  // By condition
  const conditionData = useMemo(() => {
    const map: Record<string, number> = {};
    equipment.forEach((e: any) => {
      const c = e.condition || "inconnu";
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name === "bon" ? "Bon" : name === "moyen" ? "Moyen" : name === "mauvais" ? "Mauvais" : name, value }));
  }, [equipment]);

  // By site value
  const siteValueData = useMemo(() => {
    const map: Record<string, number> = {};
    equipment.forEach((e: any) => {
      const site = (e.sites as any)?.name || "Non assigné";
      map[site] = (map[site] || 0) + (Number(e.current_value) || Number(e.purchase_price) || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [equipment]);

  // Export CSV
  const exportCSV = () => {
    const headers = ["Nom", "N° Inventaire", "Catégorie", "Site", "Prix achat", "Valeur actuelle", "Statut", "État"];
    const rows = equipment.map((e: any) => [
      e.name, e.item_number, (e.categories as any)?.name || "", (e.sites as any)?.name || "",
      e.purchase_price || "", e.current_value || "", e.operational_status || "", e.condition || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r: any) => r.map((c: any) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-equipements-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Rapports" breadcrumb={[{ label: "Rapports" }]}>
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center"><Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" /><p className="text-2xl font-bold">{equipment.length}</p><p className="text-xs text-muted-foreground">Équipements</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" /><p className="text-2xl font-bold">{totalCurrent.toLocaleString()} €</p><p className="text-xs text-muted-foreground">Valeur actuelle</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><TrendingDown className="h-5 w-5 mx-auto mb-1 text-red-500" /><p className="text-2xl font-bold">{totalDepreciation.toLocaleString()} €</p><p className="text-xs text-muted-foreground">Amortissement</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Wrench className="h-5 w-5 mx-auto mb-1 text-yellow-500" /><p className="text-2xl font-bold">{maintenanceCost.toLocaleString()} €</p><p className="text-xs text-muted-foreground">Coût maintenance</p></CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Par statut</CardTitle></CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Par état</CardTitle></CardHeader>
          <CardContent>
            {conditionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={conditionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {conditionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Valeur par site</CardTitle></CardHeader>
          <CardContent>
            {siteValueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={siteValueData}><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} €`} /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>}
          </CardContent>
        </Card>
      </div>

      {/* Export + Table */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Inventaire détaillé</h3>
        <Button size="sm" variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />Exporter CSV</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>N° Inv.</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Prix achat</TableHead>
                <TableHead>Valeur act.</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun équipement</TableCell></TableRow>
              ) : equipment.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>{e.item_number}</TableCell>
                  <TableCell>{(e.categories as any)?.name || "—"}</TableCell>
                  <TableCell>{(e.sites as any)?.name || "—"}</TableCell>
                  <TableCell>{e.purchase_price ? `${Number(e.purchase_price).toLocaleString()} €` : "—"}</TableCell>
                  <TableCell>{e.current_value ? `${Number(e.current_value).toLocaleString()} €` : "—"}</TableCell>
                  <TableCell>{e.operational_status === "en_service" ? "✅ En service" : e.operational_status === "hors_service" ? "🔴 Hors service" : e.operational_status || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Reports;
