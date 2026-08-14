/*
# Create Pachu Havens listings (single-tenant public portal)

1. New Tables
- `properties`
- `id` (uuid, primary key)
- `title` (text, public listing title)
- `location` (text, town or neighborhood)
- `price` (numeric, Kenyan shilling amount)
- `category` (text, Houses, Land & Plots, or Commercial)
- `status` (text, Available, Pending, or Sold)
- `image_url` (text, listing cover image)
- `beds` (integer, bedroom count when applicable)
- `baths` (integer, bathroom count when applicable)
- `size` (text, human-readable property size)
- `description` (text, short marketing description)
- `created_at` (timestamptz)

2. Security
- Row-level security is enabled.
- Because this portal has no sign-in flow, anon and authenticated users can read and manage the intentionally shared listings through separate CRUD policies.

3. Notes
- Seed listings are inserted with stable titles only when they do not already exist.
- Status and category values are constrained to the portal's supported options.
*/

CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  location text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  category text NOT NULL CHECK (category IN ('Houses', 'Land & Plots', 'Commercial')),
  status text NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Pending', 'Sold')),
  image_url text NOT NULL,
  beds integer NOT NULL DEFAULT 0 CHECK (beds >= 0),
  baths integer NOT NULL DEFAULT 0 CHECK (baths >= 0),
  size text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read properties" ON public.properties;
CREATE POLICY "Public can read properties" ON public.properties
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can add properties" ON public.properties;
CREATE POLICY "Public can add properties" ON public.properties
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update properties" ON public.properties;
CREATE POLICY "Public can update properties" ON public.properties
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete properties" ON public.properties;
CREATE POLICY "Public can delete properties" ON public.properties
  FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS properties_status_idx ON public.properties(status);
CREATE INDEX IF NOT EXISTS properties_category_idx ON public.properties(category);

INSERT INTO public.properties (title, location, price, category, status, image_url, beds, baths, size, description)
SELECT * FROM (VALUES
  ('The Canopy House', 'Karen, Nairobi', 18500000, 'Houses', 'Available', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85', 4, 3, '4 beds · 3 baths · 0.5 acre', 'A considered family home with leafy gardens, generous entertaining spaces, and quiet neighborhood living.'),
  ('Riverside Terraces', 'Runda, Nairobi', 24500000, 'Houses', 'Pending', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85', 5, 4, '5 beds · 4 baths · 620 m²', 'An elegant modern residence with warm natural finishes, pool terrace, and beautiful indoor-outdoor flow.'),
  ('Lakeside Edge', 'Naivasha, Nakuru', 6800000, 'Houses', 'Available', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85', 3, 2, '3 beds · 2 baths · 1/2 acre', 'A relaxed retreat with open views, sunset decks, and room to make it your own near the lake.'),
  ('Kiambu Ridge Plots', 'Kiambu Road', 2500000, 'Land & Plots', 'Available', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85', 0, 0, '1/4 acre · ready title', 'Serviced residential plots in a growing, well-connected neighborhood with a clear title.'),
  ('Westlands Studio Offices', 'Westlands, Nairobi', 9500000, 'Commercial', 'Sold', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85', 0, 2, '140 m² · 2 washrooms', 'A polished commercial suite set up for a design-led business in the heart of Westlands.'),
  ('Nakuru View Villas', 'Milimani, Nakuru', 12800000, 'Houses', 'Available', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85', 4, 3, '4 beds · 3 baths · 420 m²', 'A secure gated villa with bright interiors, a private garden, and easy access to town.'),
  ('Athi River Growth Land', 'Athi River', 4200000, 'Land & Plots', 'Pending', 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85', 0, 0, '1/2 acre · corner plot', 'A strategic corner parcel for a future home, garden project, or small development.'),
  ('Karen Courtyard Offices', 'Karen, Nairobi', 32000000, 'Commercial', 'Available', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85', 0, 4, '780 m² · 4 washrooms', 'Refined courtyard offices in a calm setting, designed for teams that value space and light.')
) AS seed(title, location, price, category, status, image_url, beds, baths, size, description)
WHERE NOT EXISTS (SELECT 1 FROM public.properties existing WHERE existing.title = seed.title);