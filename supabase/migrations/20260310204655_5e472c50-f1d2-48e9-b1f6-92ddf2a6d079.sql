-- ============================================
-- EquipTrack Multi-Tenant Schema
-- ============================================

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for auto-generating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==================
-- ORGANIZATIONS
-- ==================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sector TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ==================
-- PROFILES
-- ==================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger: auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================
-- USER ROLES (separate table per security guidelines)
-- ==================
CREATE TYPE public.app_role AS ENUM ('super_admin', 'org_admin', 'manager', 'technician', 'viewer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  UNIQUE (user_id, org_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- ==================
-- SITES
-- ==================
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- ==================
-- CATEGORIES
-- ==================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ==================
-- EQUIPMENT
-- ==================
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  item_number TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  zone TEXT,
  location_detail TEXT,
  condition TEXT DEFAULT 'bon' CHECK (condition IN ('neuf','excellent','bon','correct','reparation_requise')),
  operational_status TEXT DEFAULT 'en_service' CHECK (operational_status IN ('en_service','en_maintenance','en_stock','hors_service','transfere')),
  purchase_date DATE,
  supplier TEXT,
  purchase_price NUMERIC(12,2),
  current_value NUMERIC(12,2),
  depreciation_rate NUMERIC(5,2),
  warranty_expiry DATE,
  insurance_status TEXT,
  energy_type TEXT,
  consumption TEXT,
  last_maintenance DATE,
  next_maintenance DATE,
  acquisition_mode TEXT,
  notes TEXT,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_equipment_org ON public.equipment(org_id);
CREATE INDEX idx_equipment_category ON public.equipment(category_id);
CREATE INDEX idx_equipment_site ON public.equipment(site_id);
CREATE INDEX idx_equipment_status ON public.equipment(operational_status);

-- ==================
-- EQUIPMENT PHOTOS
-- ==================
CREATE TABLE public.equipment_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.equipment_photos ENABLE ROW LEVEL SECURITY;

-- ==================
-- AUDIT SESSIONS
-- ==================
CREATE TABLE public.audit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  site_id UUID REFERENCES public.sites(id),
  status TEXT DEFAULT 'en_cours' CHECK (status IN ('planifie','en_cours','termine','annule')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.audit_sessions ENABLE ROW LEVEL SECURITY;

-- ==================
-- AUDIT ITEMS
-- ==================
CREATE TABLE public.audit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.audit_sessions(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  verified BOOLEAN DEFAULT false,
  discrepancy TEXT,
  photo_url TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ
);
ALTER TABLE public.audit_items ENABLE ROW LEVEL SECURITY;

-- ==================
-- MAINTENANCE ORDERS
-- ==================
CREATE TABLE public.maintenance_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'preventive' CHECK (type IN ('preventive','corrective','urgence')),
  status TEXT DEFAULT 'planifie' CHECK (status IN ('planifie','en_cours','termine','annule')),
  scheduled_date DATE,
  completed_date DATE,
  technician_id UUID REFERENCES auth.users(id),
  estimated_cost NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenance_orders ENABLE ROW LEVEL SECURITY;

-- ==================
-- ACTIVITY LOG
-- ==================
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ==================
-- UPDATE TRIGGERS
-- ==================
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_orders_updated_at BEFORE UPDATE ON public.maintenance_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================
-- RLS POLICIES (all tenant-isolated via org_id)
-- ==================

-- Organizations: users can see their own org
CREATE POLICY "Users can view own org" ON public.organizations FOR SELECT USING (id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Admins can update own org" ON public.organizations FOR UPDATE USING (id = public.get_user_org_id(auth.uid()) AND (public.has_role(auth.uid(), 'org_admin') OR public.has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Anyone can insert org" ON public.organizations FOR INSERT WITH CHECK (true);

-- Profiles: users can manage their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

-- User roles: users can see their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'org_admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Sites: tenant isolation
CREATE POLICY "Users can view org sites" ON public.sites FOR SELECT USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Admins can manage sites" ON public.sites FOR ALL USING (org_id = public.get_user_org_id(auth.uid()) AND (public.has_role(auth.uid(), 'org_admin') OR public.has_role(auth.uid(), 'manager')));

-- Categories: tenant isolation
CREATE POLICY "Users can view org categories" ON public.categories FOR SELECT USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (org_id = public.get_user_org_id(auth.uid()) AND (public.has_role(auth.uid(), 'org_admin') OR public.has_role(auth.uid(), 'manager')));

-- Equipment: tenant isolation
CREATE POLICY "Users can view org equipment" ON public.equipment FOR SELECT USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Users can insert org equipment" ON public.equipment FOR INSERT WITH CHECK (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Users can update org equipment" ON public.equipment FOR UPDATE USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Admins can delete equipment" ON public.equipment FOR DELETE USING (org_id = public.get_user_org_id(auth.uid()) AND (public.has_role(auth.uid(), 'org_admin') OR public.has_role(auth.uid(), 'manager')));

-- Equipment photos: via equipment org
CREATE POLICY "Users can view equipment photos" ON public.equipment_photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.equipment e WHERE e.id = equipment_id AND e.org_id = public.get_user_org_id(auth.uid()))
);
CREATE POLICY "Users can manage equipment photos" ON public.equipment_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.equipment e WHERE e.id = equipment_id AND e.org_id = public.get_user_org_id(auth.uid()))
);

-- Audit sessions: tenant isolation
CREATE POLICY "Users can view org audits" ON public.audit_sessions FOR SELECT USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Users can manage org audits" ON public.audit_sessions FOR ALL USING (org_id = public.get_user_org_id(auth.uid()));

-- Audit items: via session
CREATE POLICY "Users can view audit items" ON public.audit_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.audit_sessions s WHERE s.id = session_id AND s.org_id = public.get_user_org_id(auth.uid()))
);
CREATE POLICY "Users can manage audit items" ON public.audit_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.audit_sessions s WHERE s.id = session_id AND s.org_id = public.get_user_org_id(auth.uid()))
);

-- Maintenance orders: tenant isolation
CREATE POLICY "Users can view org maintenance" ON public.maintenance_orders FOR SELECT USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Users can manage org maintenance" ON public.maintenance_orders FOR ALL USING (org_id = public.get_user_org_id(auth.uid()));

-- Activity log: tenant isolation
CREATE POLICY "Users can view org activity" ON public.activity_log FOR SELECT USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "System can insert activity" ON public.activity_log FOR INSERT WITH CHECK (org_id = public.get_user_org_id(auth.uid()));

-- ==================
-- STORAGE BUCKETS
-- ==================
INSERT INTO storage.buckets (id, name, public) VALUES ('equipment-photos', 'equipment-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('org-logos', 'org-logos', true);

-- Storage policies
CREATE POLICY "Public can view equipment photos" ON storage.objects FOR SELECT USING (bucket_id = 'equipment-photos');
CREATE POLICY "Authenticated users can upload equipment photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'equipment-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update equipment photos" ON storage.objects FOR UPDATE USING (bucket_id = 'equipment-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete equipment photos" ON storage.objects FOR DELETE USING (bucket_id = 'equipment-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view org logos" ON storage.objects FOR SELECT USING (bucket_id = 'org-logos');
CREATE POLICY "Authenticated users can upload org logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'org-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Enable Realtime for activity_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;