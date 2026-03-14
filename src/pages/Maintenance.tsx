import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Wrench, Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  planifie: "Planifié",
  en_cours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
};

const statusColors: Record<string, string> = {
  planifie: "bg-blue-100 text-blue-800",
  en_cours: "bg-yellow-100 text-yellow-800",
  termine: "bg-green-100 text-green-800",
  annule: "bg-muted text-muted-foreground",
};

const typeLabels: Record<string, string> = {
  preventive: "Préventive",
  corrective: "Corrective",
  inspection: "Inspection",
};

const Maintenance = () => {
  useEffect(() => {
    document.title = "Maintenance — Equipstrack";
  }, []);
  const { profile, orgInfo } = useAuth();
  const orgId = orgInfo?.orgId || profile?.org_id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ equipment_id: "", type: "preventive", description: "", scheduled_date: "", estimated_cost: "" });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["maintenance_orders", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_orders")
        .select("*, equipment(name, item_number)")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: equipmentList = [] } = useQuery({
    queryKey: ["equipment-list", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("equipment").select("id, name, item_number").eq("org_id", orgId!);
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("maintenance_orders").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance_orders"] });
      toast.success("Ordre de maintenance créé");
      setOpen(false);
      setForm({ equipment_id: "", type: "preventive", description: "", scheduled_date: "", estimated_cost: "" });
    },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "termine") updates.completed_date = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("maintenance_orders").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance_orders"] });
      toast.success("Statut mis à jour");
    },
  });

  const handleCreate = () => {
    if (!form.equipment_id || !orgId) return;
    createMutation.mutate({
      org_id: orgId,
      equipment_id: form.equipment_id,
      type: form.type,
      description: form.description || null,
      scheduled_date: form.scheduled_date || null,
      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
      created_by: profile?.id,
    });
  };

  const stats = {
    total: orders.length,
    planifie: orders.filter((o: any) => o.status === "planifie").length,
    en_cours: orders.filter((o: any) => o.status === "en_cours").length,
    termine: orders.filter((o: any) => o.status === "termine").length,
  };

  return (
    <DashboardLayout title="Maintenance" breadcrumb={[{ label: "Maintenance" }]}>
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center"><Wrench className="h-5 w-5 mx-auto mb-1 text-muted-foreground" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" /><p className="text-2xl font-bold">{stats.planifie}</p><p className="text-xs text-muted-foreground">Planifiés</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><AlertTriangle className="h-5 w-5 mx-auto mb-1 text-yellow-500" /><p className="text-2xl font-bold">{stats.en_cours}</p><p className="text-xs text-muted-foreground">En cours</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" /><p className="text-2xl font-bold">{stats.termine}</p><p className="text-xs text-muted-foreground">Terminés</p></CardContent></Card>
      </div>

      {/* Header + Create */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Ordres de maintenance</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nouvel ordre</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvel ordre de maintenance</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Équipement *</Label>
                <Select value={form.equipment_id} onValueChange={(v) => setForm({ ...form, equipment_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{equipmentList.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name} ({e.item_number})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Préventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date planifiée</Label><Input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} /></div>
              <div><Label>Coût estimé (€)</Label><Input type="number" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={handleCreate} disabled={!form.equipment_id || createMutation.isPending} className="w-full">Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Équipement</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date prévue</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Coût est.</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun ordre de maintenance</TableCell></TableRow>
              ) : orders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{(o.equipment as any)?.name || "—"}<br /><span className="text-xs text-muted-foreground">{(o.equipment as any)?.item_number}</span></TableCell>
                  <TableCell>{typeLabels[o.type] || o.type}</TableCell>
                  <TableCell>{o.scheduled_date ? format(new Date(o.scheduled_date), "dd MMM yyyy", { locale: fr }) : "—"}</TableCell>
                  <TableCell><Badge variant="secondary" className={statusColors[o.status] || ""}>{statusLabels[o.status] || o.status}</Badge></TableCell>
                  <TableCell>{o.estimated_cost ? `${Number(o.estimated_cost).toLocaleString()} €` : "—"}</TableCell>
                  <TableCell>
                    {o.status === "planifie" && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: o.id, status: "en_cours" })}>Démarrer</Button>}
                    {o.status === "en_cours" && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: o.id, status: "termine" })}>Terminer</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Maintenance;
