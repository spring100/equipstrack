import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardCheck, Eye, CheckCircle2, Clock, Archive } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const statusLabels: Record<string, string> = {
  en_cours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
};

const statusColors: Record<string, string> = {
  en_cours: "bg-yellow-100 text-yellow-800",
  termine: "bg-green-100 text-green-800",
  annule: "bg-muted text-muted-foreground",
};

const Audits = () => {
  const { profile, orgInfo } = useAuth();
  const orgId = orgInfo?.orgId || profile?.org_id;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", site_id: "", type: "inventaire" });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["audit_sessions", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_sessions")
        .select("*, sites(name)")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("id, name").eq("org_id", orgId!);
      return data || [];
    },
  });

  const { data: detail } = useQuery({
    queryKey: ["audit_session_detail", detailId],
    enabled: !!detailId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_sessions")
        .select("*, sites(name), audit_items(*, equipment(name, item_number))")
        .eq("id", detailId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      // Create session
      const { data: session, error } = await supabase.from("audit_sessions").insert(values).select().single();
      if (error) throw error;
      // Auto-populate audit items from equipment on the selected site
      const eqQuery = supabase.from("equipment").select("id").eq("org_id", values.org_id).eq("is_active", true);
      if (values.site_id) eqQuery.eq("site_id", values.site_id);
      const { data: eqList } = await eqQuery;
      if (eqList && eqList.length > 0) {
        const items = eqList.map((e: any) => ({ session_id: session.id, equipment_id: e.id }));
        await supabase.from("audit_items").insert(items);
      }
      return session;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["audit_sessions"] });
      toast.success("Session d'audit créée");
      setOpen(false);
      setForm({ name: "", site_id: "", type: "inventaire" });
    },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const completeAudit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("audit_sessions").update({ status: "termine", completed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["audit_sessions"] });
      toast.success("Audit terminé");
      setDetailId(null);
    },
  });

  const handleCreate = () => {
    if (!form.name || !orgId) return;
    createMutation.mutate({
      org_id: orgId,
      name: form.name,
      site_id: form.site_id || null,
      type: form.type,
      created_by: profile?.id,
    });
  };

  const stats = {
    total: sessions.length,
    en_cours: sessions.filter((s: any) => s.status === "en_cours").length,
    termine: sessions.filter((s: any) => s.status === "termine").length,
  };

  return (
    <DashboardLayout title="Audits" breadcrumb={[{ label: "Audits" }]}>
      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center"><ClipboardCheck className="h-5 w-5 mx-auto mb-1 text-muted-foreground" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="h-5 w-5 mx-auto mb-1 text-yellow-500" /><p className="text-2xl font-bold">{stats.en_cours}</p><p className="text-xs text-muted-foreground">En cours</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" /><p className="text-2xl font-bold">{stats.termine}</p><p className="text-xs text-muted-foreground">Terminés</p></CardContent></Card>
      </div>

      {/* Header + Create */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Sessions d'audit</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nouvelle session</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle session d'audit</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nom de la session *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Audit Q1 2026" /></div>
              <div>
                <Label>Site (optionnel)</Label>
                <Select value={form.site_id} onValueChange={(v) => setForm({ ...form, site_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Tous les sites" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les sites</SelectItem>
                    {sites.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inventaire">Inventaire</SelectItem>
                    <SelectItem value="condition">Contrôle d'état</SelectItem>
                    <SelectItem value="conformite">Conformité</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={!form.name || createMutation.isPending} className="w-full">Créer la session</Button>
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
                <TableHead>Nom</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
              ) : sessions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune session d'audit</TableCell></TableRow>
              ) : sessions.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{(s.sites as any)?.name || "Tous"}</TableCell>
                  <TableCell className="capitalize">{s.type || "—"}</TableCell>
                  <TableCell><Badge variant="secondary" className={statusColors[s.status] || ""}>{statusLabels[s.status] || s.status}</Badge></TableCell>
                  <TableCell>{format(new Date(s.created_at), "dd MMM yyyy", { locale: fr })}</TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={() => setDetailId(s.id)}><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{detail?.name || "Détail"}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <span>Site : {(detail.sites as any)?.name || "Tous"}</span>
                <Badge variant="secondary" className={statusColors[detail.status || ""] || ""}>{statusLabels[detail.status || ""] || detail.status}</Badge>
              </div>
              <h4 className="font-semibold text-sm">Équipements ({(detail.audit_items as any[])?.length || 0})</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Équipement</TableHead>
                    <TableHead>Trouvé</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead>Écart</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((detail.audit_items as any[]) || []).map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{(item.equipment as any)?.name}<br /><span className="text-xs text-muted-foreground">{(item.equipment as any)?.item_number}</span></TableCell>
                      <TableCell>{item.is_found === true ? "✅" : item.is_found === false ? "❌" : "—"}</TableCell>
                      <TableCell>{item.condition_found || "—"}</TableCell>
                      <TableCell>{item.discrepancy || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {detail.status === "en_cours" && (
                <Button onClick={() => completeAudit.mutate(detail.id)} className="w-full">
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Clôturer l'audit
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Audits;
