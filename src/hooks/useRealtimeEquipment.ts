import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useRealtimeEquipment = (orgId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "equipment", filter: `org_id=eq.${orgId}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["equipment"] });
          queryClient.invalidateQueries({ queryKey: ["equipment-list"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-equipment"] });

          if (payload.eventType === "INSERT") {
            const name = (payload.new as any)?.name;
            toast.info(`Nouvel équipement ajouté${name ? ` : ${name}` : ""}`);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_log", filter: `org_id=eq.${orgId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["activity_log"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "maintenance_orders", filter: `org_id=eq.${orgId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["maintenance_due"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-maintenance"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, queryClient]);
};
