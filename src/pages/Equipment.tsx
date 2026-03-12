import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, LayoutGrid, List, Eye, Pencil, Package } from "lucide-react";

const statusMap: Record<string, string> = {
  en_service: "active",
  en_maintenance: "maintenance",
  en_stock: "storage",
  hors_service: "decommissioned",
  transfere: "storage",
};

const conditionLabels: Record<string, string> = {
  neuf: "Neuf",
  excellent: "Excellent",
  bon: "Bon",
  correct: "Correct",
  reparation_requise: "Réparation requise",
};

const statusLabels: Record<string, string> = {
  en_service: "En service",
  en_maintenance: "En maintenance",
  en_stock: "En stock",
  hors_service: "Hors service",
  transfere: "Transféré",
};

const Equipment = () => {
  const { profile } = useAuth();
  const orgId = profile?.org_id;
  const [view, setView] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("categories").select("id, name").eq("org_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase.from("sites").select("id, name").eq("org_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: result, isLoading } = useQuery({
    queryKey: ["equipment-list", orgId, search, filterStatus, page, perPage],
    queryFn: async () => {
      if (!orgId) return { items: [], count: 0 };
      let query = supabase
        .from("equipment")
        .select("id, item_number, name, operational_status, condition, updated_at, purchase_price, current_value, photos, categories(name), sites(name), zone", { count: "exact" })
        .eq("org_id", orgId);

      if (search) {
        query = query.or(`name.ilike.%${search}%,item_number.ilike.%${search}%,serial_number.ilike.%${search}%`);
      }
      if (filterStatus !== "all") {
        query = query.eq("operational_status", filterStatus);
      }

      const { data, count } = await query
        .order("updated_at", { ascending: false })
        .range(page * perPage, (page + 1) * perPage - 1);

      return { items: data || [], count: count || 0 };
    },
    enabled: !!orgId,
  });

  const items = result?.items || [];
  const totalCount = result?.count || 0;
  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <DashboardLayout
      title="Inventaire"
      breadcrumb={[{ label: "Inventaire" }]}
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, n° item, série…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>

        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(0); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
          <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("list")}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("grid")}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>

        <Link to="/equipment/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </Link>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        {totalCount} équipement{totalCount > 1 ? "s" : ""}
      </p>

      {/* List view */}
      {view === "list" && (
        <div className="bg-card border border-border rounded-md overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-12">Photo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° Item</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Catégorie</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Site</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Zone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">État</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valeur</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((eq: any) => (
                <tr key={eq.id} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    {(() => {
                      const photoArr = eq.photos as any[];
                      const thumb = photoArr?.[0];
                      return thumb ? (
                        <img src={thumb} alt="" className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{eq.item_number}</td>
                  <td className="px-4 py-3">
                    <Link to={`/equipment/${eq.id}`} className="text-primary hover:underline font-medium">
                      {eq.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{(eq.categories as any)?.name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{(eq.sites as any)?.name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{eq.zone || "—"}</td>
                  <td className="px-4 py-3 text-xs">{conditionLabels[eq.condition] || eq.condition || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={(statusMap[eq.operational_status] || "active") as any} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {(Number(eq.current_value) || Number(eq.purchase_price) || 0).toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/equipment/${eq.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                      </Link>
                      <Link to={`/equipment/${eq.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-muted-foreground">
                    Aucun équipement trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid view */}
      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((eq: any) => (
            <Link key={eq.id} to={`/equipment/${eq.id}`} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
              {(() => {
                const photoArr = eq.photos as any[];
                const thumb = photoArr?.[0];
                return thumb ? (
                  <img src={thumb} alt="" className="w-full h-28 rounded-md object-cover mb-3" />
                ) : (
                  <div className="w-full h-28 bg-muted rounded-md flex items-center justify-center mb-3">
                    <Package className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                );
              })()}
              <p className="text-xs font-mono text-muted-foreground">{eq.item_number}</p>
              <p className="text-sm font-medium text-foreground mt-0.5 truncate">{eq.name}</p>
              <div className="flex items-center justify-between mt-2">
                <StatusBadge status={(statusMap[eq.operational_status] || "active") as any} />
                <span className="text-xs font-mono text-muted-foreground">
                  {(Number(eq.current_value) || Number(eq.purchase_price) || 0).toLocaleString("fr-FR")} €
                </span>
              </div>
            </Link>
          ))}
          {items.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Aucun équipement trouvé
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(0); }}>
              <SelectTrigger className="w-[80px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">par page</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Précédent
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {page + 1} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              Suivant
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Equipment;
