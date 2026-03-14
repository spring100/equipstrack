import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization, useUpdateOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const sectors = [
  "BTP / Construction",
  "Industrie",
  "Transport / Logistique",
  "Santé",
  "Éducation",
  "Agriculture",
  "Énergie",
  "Services",
  "Commerce",
  "Autre",
];

const OrganizationSettings = () => {
  const { orgInfo } = useAuth();
  const { data: org, isLoading } = useOrganization(orgInfo?.orgId);
  const updateOrg = useUpdateOrganization();

  const [name, setName] = useState("");
  const [sector, setSector] = useState("");

  useEffect(() => {
    if (org) {
      setName(org.name);
      setSector(org.sector || "");
    }
  }, [org]);

  const handleSave = async () => {
    if (!orgInfo?.orgId || !name.trim()) return;
    try {
      await updateOrg.mutateAsync({ id: orgInfo.orgId, name: name.trim(), sector: sector || null });
      toast({ title: "Organisation mise à jour" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de mettre à jour", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Chargement…</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisation</CardTitle>
        <CardDescription>Informations générales de votre organisation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-lg">
        <div className="space-y-2">
          <Label htmlFor="org-name">Nom de l'organisation</Label>
          <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Secteur d'activité</Label>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un secteur" /></SelectTrigger>
            <SelectContent>
              {sectors.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input value={org?.slug || ""} disabled className="opacity-60" />
          <p className="text-xs text-muted-foreground">Identifiant unique, non modifiable</p>
        </div>
        <div className="space-y-2">
          <Label>Plan</Label>
          <Input value={org?.plan || "starter"} disabled className="opacity-60 capitalize" />
        </div>
        <Button onClick={handleSave} disabled={updateOrg.isPending || !name.trim()} className="gap-2">
          <Save className="h-4 w-4" />
          Enregistrer
        </Button>
      </CardContent>
    </Card>
  );
};

export default OrganizationSettings;
