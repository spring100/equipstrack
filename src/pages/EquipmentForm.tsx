import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import CameraCapture, { type PhotoItem } from "@/components/equipment/CameraCapture";

const conditions = [
  { value: "neuf", label: "Neuf" },
  { value: "excellent", label: "Excellent" },
  { value: "bon", label: "Bon" },
  { value: "correct", label: "Correct" },
  { value: "reparation_requise", label: "Réparation requise" },
];

const statuses = [
  { value: "en_service", label: "En service" },
  { value: "en_maintenance", label: "En maintenance" },
  { value: "en_stock", label: "En stock" },
  { value: "hors_service", label: "Hors service" },
];

const acquisitionModes = [
  { value: "achat", label: "Achat" },
  { value: "don", label: "Don" },
  { value: "leasing", label: "Leasing" },
  { value: "transfert", label: "Transfert" },
];

const EquipmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { profile, user } = useAuth();
  const orgId = profile?.org_id;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  // Form state
  const [form, setForm] = useState({
    item_number: "",
    name: "",
    brand: "",
    model: "",
    serial_number: "",
    category_id: "",
    description: "",
    site_id: "",
    zone: "",
    location_detail: "",
    purchase_date: "",
    supplier: "",
    purchase_price: "",
    acquisition_mode: "",
    condition: "bon",
    operational_status: "en_service",
    insurance_status: "",
    last_maintenance: "",
    next_maintenance: "",
    current_value: "",
    depreciation_rate: "",
    warranty_expiry: "",
    energy_type: "",
    consumption: "",
    notes: "",
    tags: "",
  });

  // Load existing equipment for edit
  useQuery({
    queryKey: ["equipment-edit", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase.from("equipment").select("*").eq("id", id).single();
      if (data) {
        setForm({
          item_number: data.item_number || "",
          name: data.name || "",
          brand: data.brand || "",
          model: data.model || "",
          serial_number: data.serial_number || "",
          category_id: data.category_id || "",
          description: data.description || "",
          site_id: data.site_id || "",
          zone: data.zone || "",
          location_detail: data.location_detail || "",
          purchase_date: data.purchase_date || "",
          supplier: data.supplier || "",
          purchase_price: data.purchase_price?.toString() || "",
          acquisition_mode: data.acquisition_mode || "",
          condition: data.condition || "bon",
          operational_status: data.operational_status || "en_service",
          insurance_status: data.insurance_status || "",
          last_maintenance: data.last_maintenance || "",
          next_maintenance: data.next_maintenance || "",
          current_value: data.current_value?.toString() || "",
          depreciation_rate: data.depreciation_rate?.toString() || "",
          warranty_expiry: data.warranty_expiry || "",
          energy_type: data.energy_type || "",
          consumption: data.consumption || "",
          notes: data.notes || "",
          tags: data.tags?.join(", ") || "",
        });
      }
      return data;
    },
    enabled: isEdit,
  });

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

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const generateItemNumber = () => {
    const num = `EQ-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    update("item_number", num);
  };

  const handleSubmit = async () => {
    if (!orgId || !user) {
      toast.error("Organisation non configurée");
      return;
    }
    if (!form.name.trim() || !form.item_number.trim()) {
      toast.error("Le nom et le numéro d'item sont requis");
      return;
    }

    setLoading(true);
    const payload = {
      org_id: orgId,
      item_number: form.item_number.trim(),
      name: form.name.trim(),
      brand: form.brand || null,
      model: form.model || null,
      serial_number: form.serial_number || null,
      description: form.description || null,
      category_id: form.category_id || null,
      site_id: form.site_id || null,
      zone: form.zone || null,
      location_detail: form.location_detail || null,
      purchase_date: form.purchase_date || null,
      supplier: form.supplier || null,
      purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
      acquisition_mode: form.acquisition_mode || null,
      condition: form.condition,
      operational_status: form.operational_status,
      insurance_status: form.insurance_status || null,
      last_maintenance: form.last_maintenance || null,
      next_maintenance: form.next_maintenance || null,
      current_value: form.current_value ? parseFloat(form.current_value) : null,
      depreciation_rate: form.depreciation_rate ? parseFloat(form.depreciation_rate) : null,
      warranty_expiry: form.warranty_expiry || null,
      energy_type: form.energy_type || null,
      consumption: form.consumption || null,
      notes: form.notes || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
      photos: photos.filter(p => p.publicUrl).map(p => p.publicUrl) as any,
      created_by: isEdit ? undefined : user.id,
    };

    try {
      if (isEdit) {
        const { error } = await supabase.from("equipment").update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Équipement mis à jour");
      } else {
        const { error } = await supabase.from("equipment").insert(payload);
        if (error) throw error;
        toast.success("Équipement créé");
      }
      navigate("/equipment");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    }
    setLoading(false);
  };

  const steps = [
    { num: 1, label: "Informations générales" },
    { num: 2, label: "Localisation & Acquisition" },
    { num: 3, label: "État & Maintenance" },
    { num: 4, label: "Notes & Documents" },
  ];

  return (
    <DashboardLayout
      title={isEdit ? "Modifier l'équipement" : "Nouvel équipement"}
      breadcrumb={[
        { label: "Inventaire", path: "/equipment" },
        { label: isEdit ? "Modifier" : "Nouveau" },
      ]}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s) => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              step === s.num
                ? "bg-primary text-primary-foreground font-medium"
                : step > s.num
                ? "bg-accent/20 text-foreground"
                : "text-muted-foreground"
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
              step === s.num ? "bg-primary-foreground text-primary" : step > s.num ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-6 max-w-3xl">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold mb-4">Informations générales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>N° d'item</Label>
                <div className="flex gap-2">
                  <Input value={form.item_number} onChange={(e) => update("item_number", e.target.value)} placeholder="EQ-001" />
                  <Button type="button" variant="outline" size="sm" onClick={generateItemNumber}>Auto</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Climatiseur Daikin" />
              </div>
              <div className="space-y-2">
                <Label>Marque</Label>
                <Input value={form.brand} onChange={(e) => update("brand", e.target.value)} placeholder="Daikin, Schneider…" />
              </div>
              <div className="space-y-2">
                <Label>Modèle</Label>
                <Input value={form.model} onChange={(e) => update("model", e.target.value)} placeholder="FTXS35" />
              </div>
              <div className="space-y-2">
                <Label>N° de série</Label>
                <Input value={form.serial_number} onChange={(e) => update("serial_number", e.target.value)} placeholder="SN-XXX-XXX" />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.category_id} onValueChange={(v) => update("category_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Description de l'équipement…" rows={3} />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>Suivant</Button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold mb-4">Localisation & Acquisition</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Site</Label>
                <Select value={form.site_id} onValueChange={(v) => update("site_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {sites.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zone / Service</Label>
                <Input value={form.zone} onChange={(e) => update("zone", e.target.value)} placeholder="Étage 2, Bloc B…" />
              </div>
              <div className="space-y-2">
                <Label>Emplacement précis</Label>
                <Input value={form.location_detail} onChange={(e) => update("location_detail", e.target.value)} placeholder="Bureau 204" />
              </div>
              <div className="space-y-2">
                <Label>Date d'achat</Label>
                <Input type="date" value={form.purchase_date} onChange={(e) => update("purchase_date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fournisseur</Label>
                <Input value={form.supplier} onChange={(e) => update("supplier", e.target.value)} placeholder="Nom du fournisseur" />
              </div>
              <div className="space-y-2">
                <Label>Prix d'achat (€)</Label>
                <Input type="number" value={form.purchase_price} onChange={(e) => update("purchase_price", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Mode d'acquisition</Label>
                <Select value={form.acquisition_mode} onValueChange={(v) => update("acquisition_mode", v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {acquisitionModes.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Retour</Button>
              <Button onClick={() => setStep(3)}>Suivant</Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold mb-4">État & Maintenance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={form.condition} onValueChange={(v) => update("condition", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {conditions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut opérationnel</Label>
                <Select value={form.operational_status} onValueChange={(v) => update("operational_status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut assurance</Label>
                <Input value={form.insurance_status} onChange={(e) => update("insurance_status", e.target.value)} placeholder="Assuré, Non assuré…" />
              </div>
              <div className="space-y-2">
                <Label>Dernière maintenance</Label>
                <Input type="date" value={form.last_maintenance} onChange={(e) => update("last_maintenance", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Prochaine maintenance</Label>
                <Input type="date" value={form.next_maintenance} onChange={(e) => update("next_maintenance", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valeur actuelle (€)</Label>
                <Input type="number" value={form.current_value} onChange={(e) => update("current_value", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Taux d'amortissement (%)</Label>
                <Input type="number" value={form.depreciation_rate} onChange={(e) => update("depreciation_rate", e.target.value)} placeholder="10" />
              </div>
              <div className="space-y-2">
                <Label>Expiration garantie</Label>
                <Input type="date" value={form.warranty_expiry} onChange={(e) => update("warranty_expiry", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Type d'énergie</Label>
                <Input value={form.energy_type} onChange={(e) => update("energy_type", e.target.value)} placeholder="Électrique, Gaz…" />
              </div>
              <div className="space-y-2">
                <Label>Consommation</Label>
                <Input value={form.consumption} onChange={(e) => update("consumption", e.target.value)} placeholder="500W, 2kWh/jour…" />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Retour</Button>
              <Button onClick={() => setStep(4)}>Suivant</Button>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold mb-4">Notes & Documents</h3>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Notes internes…" rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Tags (séparés par des virgules)</Label>
              <Input value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="climatisation, étage-2, urgent" />
            </div>
            <div className="space-y-2">
              <Label>Photos</Label>
              <CameraCapture
                equipmentId={id}
                orgId={orgId}
                photos={photos}
                onPhotosChange={setPhotos}
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>Retour</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer l'équipement"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EquipmentForm;
