import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAuditLogs = (orgId?: string, equipmentId?: string) =>
  useQuery({
    queryKey: ["audit_logs", orgId, equipmentId],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (equipmentId) query = query.eq("equipment_id", equipmentId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

export const useEquipmentHistory = (equipmentId?: string) =>
  useQuery({
    queryKey: ["audit_logs", "equipment", equipmentId],
    enabled: !!equipmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("equipment_id", equipmentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
