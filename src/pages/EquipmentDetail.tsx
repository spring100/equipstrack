import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useEquipmentDetail } from "@/hooks/useEquipment";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  MapPin,
  DollarSign,
  Wrench,
  FileText,
  History,
  Info,
  Package,
  Calendar,
  Shield,
  Zap,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  en_service: "En service",
  en_maintenance: "En maintenance",
  en_stock: "En stock",
  hors_service: "Hors service",
};

const statusColors: Record<string, string> = {
  en_service: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  en_maintenance: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  en_stock: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  hors_service: "bg-red-500/15 text-red-700 border-red-500/30",
};

const conditionLabels: Record<string, string> = {
  neuf: "Neuf",
  excellent: "Excellent",
  bon: "Bon",
  correct: "Correct",
  reparation_requise: "Réparation requise",
};

const acquisitionLabels: Record<string, string> = {
  achat: "Achat",
  don: "Don",
  leasing: "Leasing",
  transfert: "Transfert",
};

const formatDate = (d: string | null | undefined) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd MMM yyyy", { locale: fr });
  } catch {
    return d;
  }
};

const formatCurrency = (v: number | null | undefined) => {
  if (v == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);
};

const InfoRow = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
    {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value || "—"}</p>
    </div>
  </div>
);

const EquipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orgInfo, profile } = useAuth();
  const orgId = orgInfo?.orgId || profile?.org_id;

  const { data: equipment, isLoading } = useEquipmentDetail(id);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  // Fetch audit logs for this equipment
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["equipment-audit-logs", id],
    queryFn: async () => {
      if (!id || !orgId) return [];
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("equipment_id", id)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!id && !!orgId,
  });

  // Fetch maintenance records
  const { data: maintenanceRecords = [] } = useQuery({
    queryKey: ["equipment-maintenance", id],
    queryFn: async () => {
      if (!id || !orgId) return [];
      const { data } = await supabase
        .from("maintenance_orders")
        .select("*")
        .eq("equipment_id", id)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id && !!orgId,
  });

  // Fetch transfers
  const { data: transfers = [] } = useQuery({
    queryKey: ["equipment-transfers", id],
    queryFn: async () => {
      if (!id || !orgId) return [];
      const { data } = await supabase
        .from("transfers")
        .select("*, from_site:sites!transfers_from_site_id_fkey(name), to_site:sites!transfers_to_site_id_fkey(name)")
        .eq("equipment_id", id)
        .eq("org_id", orgId)
        .order("transferred_at", { ascending: false });
      return data || [];
    },
    enabled: !!id && !!orgId,
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Chargement…" breadcrumb={[{ label: "Inventaire", path: "/equipment" }, { label: "…" }]}>
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-muted-foreground">Chargement de l'équipement…</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!equipment) {
    return (
      <DashboardLayout title="Introuvable" breadcrumb={[{ label: "Inventaire", path: "/equipment" }, { label: "Introuvable" }]}>
        <div className="text-center py-20 space-y-3">
          <Package className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Aucun équipement trouvé.</p>
          <Button variant="outline" asChild><Link to="/equipment">Retour à la liste</Link></Button>
        </div>
      </DashboardLayout>
    );
  }

  const photos: string[] = Array.isArray(equipment.photos) ? (equipment.photos as string[]) : [];
  const hasPhotos = photos.length > 0;
  const currentPhoto = hasPhotos ? photos[photoIndex] : null;
  const siteName = (equipment.sites as any)?.name;
  const categoryName = (equipment.categories as any)?.name;
  const qrValue = `${window.location.origin}/equipment/${equipment.id}`;

  const maintenanceStatusLabels: Record<string, string> = {
    planifie: "Planifié",
    en_cours: "En cours",
    termine: "Terminé",
    annule: "Annulé",
  };

  return (
    <DashboardLayout
      title={equipment.name}
      breadcrumb={[
        { label: "Inventaire", path: "/equipment" },
        { label: equipment.name },
      ]}
    >
      {/* Header card with photo carousel + core info */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
          {/* Photo carousel — 2 cols */}
          <div className="lg:col-span-2 bg-muted/50 relative">
            <div className="aspect-square flex items-center justify-center overflow-hidden">
              {currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt={equipment.name}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => setFullscreenPhoto(currentPhoto)}
                />
              ) : (
                <div className="text-center space-y-2">
                  <Package className="w-16 h-16 mx-auto text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">Aucune photo</p>
                </div>
              )}
            </div>

            {/* Photo navigation */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === photoIndex ? "bg-primary" : "bg-foreground/30"}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Photo count badge */}
            {hasPhotos && (
              <div className="absolute top-3 right-3 bg-background/80 backdrop-blur text-xs px-2 py-1 rounded-md font-mono">
                {photoIndex + 1}/{photos.length}
              </div>
            )}
          </div>

          {/* Core metadata — 3 cols */}
          <div className="lg:col-span-3 p-6 flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground font-mono mb-1">{equipment.item_number}</p>
                <h2 className="text-xl font-bold text-foreground">{equipment.name}</h2>
                {equipment.brand && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {equipment.brand} {equipment.model ? `— ${equipment.model}` : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={statusColors[equipment.operational_status || "en_service"]}>
                  {statusLabels[equipment.operational_status || "en_service"]}
                </Badge>
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/equipment/${equipment.id}/edit`}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Modifier
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm flex-1">
              <div>
                <p className="text-xs text-muted-foreground">Catégorie</p>
                <p className="font-medium">{categoryName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Site</p>
                <p className="font-medium">{siteName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Zone</p>
                <p className="font-medium">{equipment.zone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">N° de série</p>
                <p className="font-mono text-xs">{equipment.serial_number || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Condition</p>
                <p className="font-medium">{conditionLabels[equipment.condition || ""] || equipment.condition || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valeur actuelle</p>
                <p className="font-semibold text-primary">{formatCurrency(equipment.current_value ?? equipment.purchase_price)}</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-4">
              <QRCodeSVG value={qrValue} size={64} level="M" />
              <div>
                <p className="text-xs text-muted-foreground">QR Code — Scanner pour accéder</p>
                <p className="text-xs font-mono text-muted-foreground mt-0.5 break-all">{qrValue}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="infos" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="infos" className="gap-1.5"><Info className="w-3.5 h-3.5" /> Infos</TabsTrigger>
          <TabsTrigger value="localisation" className="gap-1.5"><MapPin className="w-3.5 h-3.5" /> Localisation</TabsTrigger>
          <TabsTrigger value="finance" className="gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Finance</TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1.5"><Wrench className="w-3.5 h-3.5" /> Maintenance</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Documents</TabsTrigger>
          <TabsTrigger value="historique" className="gap-1.5"><History className="w-3.5 h-3.5" /> Historique</TabsTrigger>
        </TabsList>

        {/* INFOS TAB */}
        <TabsContent value="infos">
          <div className="bg-card border border-border rounded-lg p-5 space-y-1">
            <InfoRow label="Nom" value={equipment.name} icon={Tag} />
            <InfoRow label="Marque" value={equipment.brand} icon={Tag} />
            <InfoRow label="Modèle" value={equipment.model} icon={Tag} />
            <InfoRow label="N° de série" value={<span className="font-mono">{equipment.serial_number}</span>} icon={Tag} />
            <InfoRow label="N° d'inventaire" value={<span className="font-mono">{equipment.item_number}</span>} icon={Tag} />
            <InfoRow label="Catégorie" value={categoryName} icon={Tag} />
            <InfoRow label="Sous-catégorie" value={equipment.subcategory} icon={Tag} />
            <InfoRow label="Description" value={equipment.description} icon={Info} />
            <InfoRow label="Type d'énergie" value={equipment.energy_type} icon={Zap} />
            <InfoRow label="Consommation" value={equipment.consumption} icon={Zap} />
            {equipment.tags && equipment.tags.length > 0 && (
              <div className="flex items-start gap-3 py-2.5">
                <Tag className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {equipment.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* LOCALISATION TAB */}
        <TabsContent value="localisation">
          <div className="bg-card border border-border rounded-lg p-5 space-y-1">
            <InfoRow label="Site" value={siteName} icon={MapPin} />
            <InfoRow label="Zone / Service" value={equipment.zone} icon={MapPin} />
            <InfoRow label="Emplacement précis" value={equipment.location_detail} icon={MapPin} />
            <InfoRow label="Emplacement actuel" value={equipment.current_location} icon={MapPin} />
          </div>

          {/* Transfer history */}
          {transfers.length > 0 && (
            <div className="mt-4 bg-card border border-border rounded-lg p-5">
              <h4 className="text-sm font-semibold mb-3">Historique des transferts</h4>
              <div className="space-y-3">
                {transfers.map((t: any) => (
                  <div key={t.id} className="flex items-start gap-3 text-sm border-b border-border/50 pb-3 last:border-0">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p>
                        {t.from_site?.name || "—"} → <span className="font-medium">{t.to_site?.name || "—"}</span>
                      </p>
                      {t.reason && <p className="text-xs text-muted-foreground">{t.reason}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                      {formatDate(t.transferred_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* FINANCE TAB */}
        <TabsContent value="finance">
          <div className="bg-card border border-border rounded-lg p-5 space-y-1">
            <InfoRow label="Prix d'achat" value={formatCurrency(equipment.purchase_price)} icon={DollarSign} />
            <InfoRow label="Valeur actuelle" value={formatCurrency(equipment.current_value)} icon={DollarSign} />
            <InfoRow label="Amortissement annuel" value={formatCurrency(equipment.annual_depreciation)} icon={DollarSign} />
            <InfoRow label="Taux d'amortissement" value={equipment.depreciation_rate ? `${equipment.depreciation_rate}%` : "—"} icon={DollarSign} />
            <InfoRow label="Mode d'acquisition" value={acquisitionLabels[equipment.acquisition_mode || ""] || equipment.acquisition_mode} icon={DollarSign} />
            <InfoRow label="Fournisseur" value={equipment.supplier} icon={Tag} />
            <InfoRow label="Date d'achat" value={formatDate(equipment.purchase_date)} icon={Calendar} />
            <InfoRow label="Statut assurance" value={equipment.insurance_status} icon={Shield} />
          </div>
        </TabsContent>

        {/* MAINTENANCE TAB */}
        <TabsContent value="maintenance">
          <div className="bg-card border border-border rounded-lg p-5 space-y-1 mb-4">
            <InfoRow label="Dernière maintenance" value={formatDate(equipment.last_maintenance)} icon={Wrench} />
            <InfoRow label="Prochaine maintenance" value={formatDate(equipment.next_maintenance)} icon={Calendar} />
            <InfoRow label="Expiration garantie" value={formatDate(equipment.warranty_expiry)} icon={Shield} />
          </div>

          {maintenanceRecords.length > 0 ? (
            <div className="bg-card border border-border rounded-lg p-5">
              <h4 className="text-sm font-semibold mb-3">Ordres de maintenance</h4>
              <div className="space-y-3">
                {maintenanceRecords.map((m: any) => (
                  <div key={m.id} className="flex items-start gap-3 text-sm border-b border-border/50 pb-3 last:border-0">
                    <Wrench className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{m.description || "Maintenance"}</p>
                      <p className="text-xs text-muted-foreground">
                        Type : {m.type || "—"} • Coût : {formatCurrency(m.actual_cost ?? m.estimated_cost)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {maintenanceStatusLabels[m.status] || m.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {formatDate(m.scheduled_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
              Aucun ordre de maintenance enregistré.
            </div>
          )}
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents">
          <div className="bg-card border border-border rounded-lg p-5">
            {equipment.manual_url ? (
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Manuel d'utilisation</p>
                  <a href={equipment.manual_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    Ouvrir le document
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
                Aucun document associé.
              </div>
            )}

            {equipment.notes && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{equipment.notes}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* HISTORIQUE TAB */}
        <TabsContent value="historique">
          {auditLogs.length > 0 ? (
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="relative pl-6">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-0">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="relative pl-6 py-3 hover:bg-muted/50 rounded-md transition-colors">
                      <div className="absolute left-[-17px] top-[18px] w-3 h-3 rounded-full border-2 border-border bg-card" />
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm text-foreground">{log.action}</p>
                          {log.field_changed && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {log.field_changed}: {log.old_value || "—"} → {log.new_value || "—"}
                            </p>
                          )}
                          {log.notes && <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>}
                        </div>
                        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
              <History className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
              Aucun historique enregistré.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Fullscreen photo dialog */}
      <Dialog open={!!fullscreenPhoto} onOpenChange={() => setFullscreenPhoto(null)}>
        <DialogContent className="max-w-4xl p-1 bg-background/95 backdrop-blur">
          {fullscreenPhoto && (
            <img src={fullscreenPhoto} alt="Photo" className="w-full h-auto max-h-[85vh] object-contain rounded" />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default EquipmentDetail;
