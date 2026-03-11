import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export const useEquipmentList = (orgId?: string) =>
  useQuery({
    queryKey: ["equipment", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select("*, sites(name), categories(name)")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useEquipmentDetail = (id?: string) =>
  useQuery({
    queryKey: ["equipment", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select("*, sites(name), categories(name), equipment_photos(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

export const useCreateEquipment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesInsert<"equipment">) => {
      const { data, error } = await supabase.from("equipment").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipment"] }),
  });
};

export const useUpdateEquipment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: TablesUpdate<"equipment"> & { id: string }) => {
      const { data, error } = await supabase.from("equipment").update(values).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipment"] }),
  });
};

export const useDeleteEquipment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipment"] }),
  });
};
