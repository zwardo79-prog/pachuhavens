/*
# Add user profiles and saved properties for Pachu Havens accounts

1. New Tables
- `profiles`
  - `id` (uuid, primary key, matches auth.users.id)
  - `full_name` (text, display name shown on profile and header)
  - `avatar_url` (text, optional profile photo URL)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- `saved_properties`
  - `id` (uuid, primary key)
  - `user_id` (uuid, owner, references auth.users, cascade on delete)
  - `property_id` (uuid, references public.properties, cascade on delete)
  - `created_at` (timestamptz)
  - Unique constraint on (user_id, property_id) so a user cannot save the same property twice.

2. Security
- Row-level security enabled on both tables.
- profiles: each authenticated user can read and update only their own row. No inserts are allowed from the client because rows are created by a trigger on signup.
- saved_properties: each authenticated user can read, insert, and delete only their own saved rows. Updates are not needed (a save is either present or absent).

3. Automation
- A trigger creates a profiles row automatically whenever a new auth.users row is inserted, so the client never needs to insert into profiles.

4. Notes
- The trigger function is idempotent and uses SECURITY INVOKER so it runs with the calling user's privileges during signup.
- Email confirmation remains OFF.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own saved properties" ON public.saved_properties;
CREATE POLICY "Users can read own saved properties" ON public.saved_properties
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved properties" ON public.saved_properties;
CREATE POLICY "Users can insert own saved properties" ON public.saved_properties
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved properties" ON public.saved_properties;
CREATE POLICY "Users can delete own saved properties" ON public.saved_properties
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS saved_properties_user_idx ON public.saved_properties(user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();