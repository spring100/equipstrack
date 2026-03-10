-- Fix overly permissive INSERT policies

-- Organizations: only authenticated users can create
DROP POLICY "Anyone can insert org" ON public.organizations;
CREATE POLICY "Authenticated users can insert org" ON public.organizations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Profiles: only the user themselves can insert their profile
DROP POLICY "System can insert profiles" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);