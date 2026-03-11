import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export const useSites = (orgId?: string) =>
  useQuery({
    queryKey: ["sites", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("sites").select("*").eq("org_id", orgId!).order("name");
      if (error) throw error;
      return data;
    },
  });

export const useCreateSite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesInsert<"sites">) => {
      const { data, error } = await supabase.from("sites").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sites"] }),
  });
};

export const useUpdateSite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: TablesUpdate<"sites"> & { id: string }) => {
      const { data, error } = await supabase.from("sites").update(values).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sites"] }),
  });
};

export const useDeleteSite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sites"] }),
  });
};
