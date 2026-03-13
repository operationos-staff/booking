ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Групповые туры';
