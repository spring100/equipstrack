import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgMembers, useUpdateMemberRole, useRemoveMember } from "@/hooks/useOrgMembers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

const roleLabels: Record<string, string> = {
  owner: "Propriétaire",
  org_admin: "Administrateur",
  manager: "Gestionnaire",
  technician: "Technicien",
  viewer: "Lecteur",
};

const editableRoles = ["org_admin", "manager", "technician", "viewer"];

const MembersSettings = () => {
  const { orgInfo, user } = useAuth();
  const { data: members, isLoading } = useOrgMembers(orgInfo?.orgId);
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      await updateRole.mutateAsync({ id: memberId, role });
      toast({ title: "Rôle mis à jour" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await removeMember.mutateAsync(memberId);
      toast({ title: "Membre retiré" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return "?";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membres</CardTitle>
        <CardDescription>Gérez les utilisateurs et leurs rôles dans l'organisation</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : !members?.length ? (
          <p className="text-sm text-muted-foreground">Aucun membre</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const profile = m.profiles as { full_name?: string | null; email?: string | null; avatar_url?: string | null } | null;
                const isSelf = m.user_id === user?.id;
                const isOwner = m.role === "owner";

                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(profile?.full_name, profile?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{profile?.full_name || "Sans nom"}</p>
                          <p className="text-xs text-muted-foreground">{profile?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isOwner ? (
                        <Badge variant="secondary">{roleLabels[m.role || "viewer"]}</Badge>
                      ) : (
                        <Select
                          value={m.role || "viewer"}
                          onValueChange={(v) => handleRoleChange(m.id, v)}
                          disabled={isSelf}
                        >
                          <SelectTrigger className="w-40 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {editableRoles.map((r) => (
                              <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {!isSelf && !isOwner && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {profile?.full_name || profile?.email} n'aura plus accès à l'organisation.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemove(m.id)}>Retirer</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default MembersSettings;
