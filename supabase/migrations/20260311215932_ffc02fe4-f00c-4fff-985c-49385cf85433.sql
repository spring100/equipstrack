
-- Add missing columns to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS plan text DEFAULT 'starter';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}';

-- Add unique constraint on slug (generate slugs for existing rows first)
UPDATE public.organizations SET slug = lower(replace(name, ' ', '-')) || '-' || substring(id::text, 1, 4) WHERE slug IS NULL;
ALTER TABLE public.organizations ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_unique ON public.organizations(slug);

-- Add missing columns to sites
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS country text;

-- Add missing columns to equipment
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS current_location text;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS manual_url text;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS accessories jsonb DEFAULT '[]';
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS spare_parts jsonb DEFAULT '[]';
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]';
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS qr_code text;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS annual_depreciation numeric(12,2);

-- Generate qr_code for existing rows
UPDATE public.equipment SET qr_code = 'EQT-' || upper(substring(id::text, 1, 8)) WHERE qr_code IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS equipment_qr_code_unique ON public.equipment(qr_code);

-- Add missing columns to audit_items
ALTER TABLE public.audit_items ADD COLUMN IF NOT EXISTS is_found boolean;
ALTER TABLE public.audit_items ADD COLUMN IF NOT EXISTS condition_found text;
ALTER TABLE public.audit_items ADD COLUMN IF NOT EXISTS discrepancy_notes text;
ALTER TABLE public.audit_items ADD COLUMN IF NOT EXISTS audited_by uuid;
ALTER TABLE public.audit_items ADD COLUMN IF NOT EXISTS audited_at timestamptz;

-- Create transfers table
CREATE TABLE IF NOT EXISTS public.transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  from_site_id uuid REFERENCES public.sites(id),
  to_site_id uuid REFERENCES public.sites(id),
  from_zone text,
  to_zone text,
  reason text,
  transferred_by uuid,
  transferred_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org transfers" ON public.transfers
  FOR SELECT USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can insert org transfers" ON public.transfers
  FOR INSERT WITH CHECK (org_id = get_user_org_id(auth.uid()));

-- Create org_members table
CREATE TABLE IF NOT EXISTS public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'viewer' CHECK (role IN ('owner','admin','manager','technician','viewer')),
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  UNIQUE (org_id, user_id)
);

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org members" ON public.org_members
  FOR SELECT USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Admins can manage org members" ON public.org_members
  FOR ALL USING (
    org_id = get_user_org_id(auth.uid()) 
    AND (has_role(auth.uid(), 'org_admin') OR has_role(auth.uid(), 'super_admin'))
  );

-- Create audit_logs table (detailed field-level changes)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE SET NULL,
  user_id uuid,
  action text NOT NULL,
  field_changed text,
  old_value text,
  new_value text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org audit logs" ON public.audit_logs
  FOR SELECT USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can insert org audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (org_id = get_user_org_id(auth.uid()));

-- Create maintenance_records table (more detailed than maintenance_orders)
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  type text CHECK (type IN ('preventive','corrective','inspection','calibration')) DEFAULT 'preventive',
  status text CHECK (status IN ('scheduled','in_progress','completed','cancelled')) DEFAULT 'scheduled',
  performed_by text,
  cost numeric(10,2),
  notes text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  next_scheduled timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org maintenance records" ON public.maintenance_records
  FOR SELECT USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can manage org maintenance records" ON public.maintenance_records
  FOR ALL USING (org_id = get_user_org_id(auth.uid()));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.transfers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_records;
