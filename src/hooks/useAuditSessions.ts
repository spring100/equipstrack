import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert } from "@/integrations/supabase/types";

export const useAuditSessions = (orgId?: string) =>
  useQuery({
    queryKey: ["audit_sessions", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_sessions")
        .select("*, sites(name)")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useAuditSessionDetail = (id?: string) =>
  useQuery({
    queryKey: ["audit_sessions", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_sessions")
        .select("*, sites(name), audit_items(*, equipment(name, item_number))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

export const useCreateAuditSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesInsert<"audit_sessions">) => {
      const { data, error } = await supabase.from("audit_sessions").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audit_sessions"] }),
  });
};

export const useUpdateAuditItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: any) => {
      const { data, error } = await supabase.from("audit_items").update(values).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audit_sessions"] }),
  });
};
