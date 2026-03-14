import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSites, useCreateSite, useUpdateSite, useDeleteSite } from "@/hooks/useSites";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Site = Tables<"sites">;

const emptySite = { name: "", address: "", city: "", country: "" };

const SitesSettings = () => {
  const { orgInfo } = useAuth();
  const { data: sites, isLoading } = useSites(orgInfo?.orgId);
  const createSite = useCreateSite();
  const updateSite = useUpdateSite();
  const deleteSite = useDeleteSite();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [form, setForm] = useState(emptySite);

  const openNew = () => { setEditing(null); setForm(emptySite); setOpen(true); };
  const openEdit = (s: Site) => {
    setEditing(s);
    setForm({ name: s.name, address: s.address || "", city: s.city || "", country: s.country || "" });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!orgInfo?.orgId || !form.name.trim()) return;
    try {
      if (editing) {
        await updateSite.mutateAsync({ id: editing.id, ...form });
        toast({ title: "Site mis à jour" });
      } else {
        await createSite.mutateAsync({ org_id: orgInfo.orgId, ...form });
        toast({ title: "Site créé" });
      }
      setOpen(false);
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSite.mutateAsync(id);
      toast({ title: "Site supprimé" });
    } catch {
      toast({ title: "Erreur", description: "Ce site est peut-être utilisé par des équipements", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Sites</CardTitle>
          <CardDescription>Gérez les sites / localisations</CardDescription>
        </div>
        <Button onClick={openNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : !sites?.length ? (
          <p className="text-sm text-muted-foreground">Aucun site configuré</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.city || "—"}</TableCell>
                  <TableCell>{s.country || "—"}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le site ?</AlertDialogTitle>
                          <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(s.id)}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le site" : "Nouveau site"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              {editing ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SitesSettings;
