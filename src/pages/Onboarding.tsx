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

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, refreshOrgInfo } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [orgName, setOrgName] = useState("");
  // Step 2
  const [sector, setSector] = useState("");
  // Step 3
  const [siteName, setSiteName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");

  const handleFinish = async () => {
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }
    setLoading(true);
    try {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: orgName, sector, slug: orgName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36) })
        .select()
        .single();
      if (orgError) throw orgError;

      // Update profile with org_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ org_id: org.id })
        .eq("id", user.id);
      if (profileError) throw profileError;

      // Assign org_admin role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, org_id: org.id, role: "org_admin" });
      if (roleError) throw roleError;

      // Create first site
      if (siteName) {
        const { error: siteError } = await supabase
          .from("sites")
          .insert({ org_id: org.id, name: siteName, address: siteAddress });
        if (siteError) throw siteError;
      }

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
          <p className="text-sm text-muted-foreground mt-1">Configurez votre espace</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-accent" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Nom de l'organisation</h2>
              <p className="text-sm text-muted-foreground">Comment s'appelle votre structure ?</p>
              <div className="space-y-2">
                <Label htmlFor="orgName">Nom</Label>
                <Input
                  id="orgName"
                  placeholder="Hôtel Le Méridien, CHU de Bordeaux…"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={!orgName.trim()} onClick={() => setStep(2)}>
                Suivant
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Secteur d'activité</h2>
              <p className="text-sm text-muted-foreground">Quel est votre domaine ?</p>
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
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Retour
                </Button>
                <Button className="flex-1" disabled={!sector} onClick={() => setStep(3)}>
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Premier site</h2>
              <p className="text-sm text-muted-foreground">Ajoutez votre premier site ou bâtiment.</p>
              <div className="space-y-2">
                <Label htmlFor="siteName">Nom du site</Label>
                <Input
                  id="siteName"
                  placeholder="Bâtiment principal, Site A…"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteAddress">Adresse (optionnel)</Label>
                <Input
                  id="siteAddress"
                  placeholder="123 rue Example, Ville"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  Retour
                </Button>
                <Button className="flex-1" disabled={loading} onClick={handleFinish}>
                  {loading ? "Création…" : "Terminer"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
