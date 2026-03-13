-- ─── EXCURSIONS TABLE ─────────────────────────────────────────
-- Unified table for all excursion types
-- pricing_model: 'per_person' | 'per_boat' | 'per_group'

CREATE TABLE IF NOT EXISTS public.excursions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name              TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'Групповые туры',
  excursion_type    TEXT NOT NULL DEFAULT 'base',
  provider          TEXT DEFAULT '',
  pricing_model     TEXT NOT NULL DEFAULT 'per_person',
  mgr_price         INTEGER DEFAULT 0,
  netto_price       INTEGER DEFAULT 0,
  mgr_price_child   INTEGER DEFAULT 0,
  netto_price_child INTEGER DEFAULT 0,
  duration_hours    INTEGER DEFAULT 8,
  extra_hour        INTEGER DEFAULT 1000,
  max_pax           INTEGER DEFAULT 0,
  note              TEXT DEFAULT '',
  netto_detail      TEXT DEFAULT '',
  is_active         BOOLEAN DEFAULT true,
  sort_order        INTEGER DEFAULT 0,
  custom_fields     JSONB DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.excursions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all"
  ON public.excursions FOR SELECT USING (true);

CREATE POLICY "Allow write for authenticated"
  ON public.excursions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
