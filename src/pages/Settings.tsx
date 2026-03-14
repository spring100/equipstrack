import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizationSettings from "@/components/settings/OrganizationSettings";
import SitesSettings from "@/components/settings/SitesSettings";
import CategoriesSettings from "@/components/settings/CategoriesSettings";
import MembersSettings from "@/components/settings/MembersSettings";
import { Building2, MapPin, FolderTree, Users } from "lucide-react";

const Settings = () => {
  const { orgInfo } = useAuth();

  useEffect(() => {
    document.title = "Paramètres — Equipstrack";
  }, []);

  return (
    <DashboardLayout
      title="Paramètres"
      breadcrumb={[{ label: "Paramètres" }]}
    >
      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organisation</span>
          </TabsTrigger>
          <TabsTrigger value="sites" className="gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Sites</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderTree className="h-4 w-4" />
            <span className="hidden sm:inline">Catégories</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Membres</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <OrganizationSettings />
        </TabsContent>
        <TabsContent value="sites">
          <SitesSettings />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesSettings />
        </TabsContent>
        <TabsContent value="members">
          <MembersSettings />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;
