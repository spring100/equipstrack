import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTransfers = (orgId?: string) =>
  useQuery({
    queryKey: ["transfers", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfers")
        .select("*, equipment(name, item_number)")
        .eq("org_id", orgId!)
        .order("transferred_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase.from("transfers").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      qc.invalidateQueries({ queryKey: ["equipment"] });
    },
  });
};
