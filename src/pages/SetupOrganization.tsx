import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const sectors = [
  "Hôtellerie",
  "Santé / Clinique",
  "Administration publique",
  "ONG / Humanitaire",
  "Éducation",
  "Industrie",
  "Autre",
];

const SetupOrganization = () => {
  const navigate = useNavigate();
  const { user, refreshOrgInfo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [sector, setSector] = useState("");
  const [siteName, setSiteName] = useState("");
  const [city, setCity] = useState("");

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }
    if (!orgName.trim()) {
      toast.error("Le nom de l'organisation est requis");
      return;
    }

    setLoading(true);
    try {
      // 1. Create organization
      const slug = orgName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36);
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: orgName.trim(), slug, sector: sector || null })
        .select()
        .single();
      if (orgError) throw orgError;

      // 2. Create default site
      if (siteName.trim()) {
        const { error: siteError } = await supabase
          .from("sites")
          .insert({ org_id: org.id, name: siteName.trim(), city: city || null });
        if (siteError) throw siteError;
      }

      // 3. Link user to org via org_members
      const { error: memberError } = await supabase
        .from("org_members")
        .insert({ org_id: org.id, user_id: user.id, role: "owner" });
      if (memberError) throw memberError;

      // 4. Assign org_admin role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, org_id: org.id, role: "org_admin" });
      if (roleError) throw roleError;

      // 5. Update profile org_id
      await supabase.from("profiles").update({ org_id: org.id }).eq("id", user.id);

      // 6. Refresh context
      await refreshOrgInfo();

      toast.success("Organisation créée avec succès !");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la configuration");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">EquipTrack</h1>
          <p className="text-sm text-muted-foreground mt-1">Configurez votre organisation</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Nouvelle organisation</h2>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Nom de l'organisation *</Label>
              <Input
                id="orgName"
                placeholder="Hôtel Le Méridien, CHU de Bordeaux…"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Secteur d'activité</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un secteur" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteName">Premier site (optionnel)</Label>
              <Input
                id="siteName"
                placeholder="Bâtiment principal, Site A…"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville (optionnel)</Label>
              <Input
                id="city"
                placeholder="Paris, Dakar, Abidjan…"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !orgName.trim()}>
              {loading ? "Création…" : "Configurer mon organisation"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupOrganization;
