import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

const CategoriesSettings = () => {
  const { orgInfo } = useAuth();
  const { data: categories, isLoading } = useCategories(orgInfo?.orgId);
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState("");

  const handleAdd = async () => {
    if (!orgInfo?.orgId || !newName.trim()) return;
    try {
      await createCategory.mutateAsync({ org_id: orgInfo.orgId, name: newName.trim() });
      setNewName("");
      toast({ title: "Catégorie créée" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast({ title: "Catégorie supprimée" });
    } catch {
      toast({ title: "Erreur", description: "Catégorie peut-être utilisée par des équipements", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catégories</CardTitle>
        <CardDescription>Organisez vos équipements par catégorie</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 max-w-md">
          <Input
            placeholder="Nom de la catégorie"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={!newName.trim()} size="sm" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : !categories?.length ? (
          <p className="text-sm text-muted-foreground">Aucune catégorie</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
                          <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(c.id)}>Supprimer</AlertDialogAction>
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
    </Card>
  );
};

export default CategoriesSettings;
