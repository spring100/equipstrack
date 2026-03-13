import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface OrgInfo {
  orgId: string;
  orgName: string;
  orgLogoUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: { id: string; email: string; full_name: string; org_id: string | null; avatar_url: string | null } | null;
  orgInfo: OrgInfo | null;
  userRole: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshOrgInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  orgInfo: null,
  userRole: null,
  loading: true,
  signOut: async () => {},
  refreshOrgInfo: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, org_id, avatar_url")
      .eq("id", userId)
      .single();
    setProfile(data);
    return data;
  };

  const fetchOrgMembership = async (userId: string) => {
    // Try org_members first
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id, role, organizations(name, logo_url)")
      .eq("user_id", userId)
      .maybeSingle();

    if (membership?.org_id) {
      const org = membership.organizations as any;
      setOrgInfo({
        orgId: membership.org_id,
        orgName: org?.name || "",
        orgLogoUrl: org?.logo_url || null,
      });
      setUserRole(membership.role || "viewer");
      return;
    }

    // Fallback: check profile.org_id
    const { data: prof } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", userId)
      .single();

    if (prof?.org_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id, name, logo_url")
        .eq("id", prof.org_id)
        .single();

      if (org) {
        setOrgInfo({
          orgId: org.id,
          orgName: org.name,
          orgLogoUrl: org.logo_url,
        });
        // Check user_roles for role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("org_id", org.id)
          .maybeSingle();
        setUserRole(roleData?.role || "viewer");
        return;
      }
    }

    setOrgInfo(null);
    setUserRole(null);
  };

  const refreshOrgInfo = async () => {
    if (user) {
      await fetchOrgMembership(user.id);
      await fetchProfile(user.id);
    }
  };

  const loadUserData = async (currentUser: User) => {
    await fetchProfile(currentUser.id);
    await fetchOrgMembership(currentUser.id);
  };

  useEffect(() => {
    let initialLoad = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setProfile(null);
          setOrgInfo(null);
          setUserRole(null);
        }
        if (initialLoad) {
          initialLoad = false;
        } else {
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserData(session.user);
      }
      setLoading(false);
      initialLoad = false;
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setOrgInfo(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, orgInfo, userRole, loading, signOut, refreshOrgInfo }}>
      {children}
    </AuthContext.Provider>
  );
};
