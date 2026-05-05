-- ============================================================
-- PARTNERS — поставщики услуг
-- ============================================================

CREATE TABLE IF NOT EXISTS public.partners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  short_name      TEXT NOT NULL DEFAULT '',
  icon            TEXT NOT NULL DEFAULT '🏢',
  color           TEXT NOT NULL DEFAULT '#8b5cf6',
  categories      TEXT[] NOT NULL DEFAULT '{}',  -- transport / guide / meal / location / activity / stay / shopping / extra
  contact_phone   TEXT NOT NULL DEFAULT '',
  contact_email   TEXT NOT NULL DEFAULT '',
  contact_telegram TEXT NOT NULL DEFAULT '',
  contact_whatsapp TEXT NOT NULL DEFAULT '',
  website         TEXT NOT NULL DEFAULT '',
  address         TEXT NOT NULL DEFAULT '',
  notes           TEXT NOT NULL DEFAULT '',
  active          BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partners_active     ON public.partners(active);
CREATE INDEX IF NOT EXISTS idx_partners_categories ON public.partners USING gin(categories);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partners_select" ON public.partners;
DROP POLICY IF EXISTS "partners_insert" ON public.partners;
DROP POLICY IF EXISTS "partners_update" ON public.partners;
DROP POLICY IF EXISTS "partners_delete" ON public.partners;
CREATE POLICY "partners_select" ON public.partners FOR SELECT TO authenticated USING (true);
-- Только booking может править партнёров (manager только читает)
CREATE POLICY "partners_insert" ON public.partners FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'booking'));
CREATE POLICY "partners_update" ON public.partners FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'booking'));
CREATE POLICY "partners_delete" ON public.partners FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'booking'));

-- Связь tour_atoms ← partners
ALTER TABLE public.tour_atoms
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_atoms_partner ON public.tour_atoms(partner_id);

-- Стартовый набор партнёров (примеры — оперейшен потом доредактирует)
INSERT INTO public.partners (name, short_name, icon, color, categories, notes, sort_order) VALUES
  ('Остров Сокровищ',          'Остров Сокровищ', '🏝',  '#f59e0b', '{transport,guide,activity}', 'Своя команда', 1),
  ('Phuket Elephant Sanctuary', 'Elephant Sanctuary', '🐘', '#10b981', '{activity,location}',     'Слоны / купание', 10),
  ('Phuket Bird Park',          'Bird Park',         '🦜', '#22d3ee', '{activity,location}',     'Парк птиц',       11),
  ('Crocodile Farm Phuket',     'Croc Farm',         '🐊', '#0ea5e9', '{activity,location}',     'Крокодиловая ферма', 12),
  ('Snake Farm PH+',            'Snake Farm',        '🐍', '#84cc16', '{activity,location}',     'Шоу с кобрами',   13),
  ('Mantra Spa',                'Mantra Spa',        '💆', '#ec4899', '{activity}',              'Релакс-спа',       14),
  ('Boat Lagoon Marina',        'Boat Lagoon',       '🚤', '#8b5cf6', '{transport}',             'Стартовый пирс чартеров', 20),
  ('Local Boats',               'Local Boats',       '⛵', '#a78bfa', '{transport}',             'Лонгтейлы',         21),
  ('Speedboat 2 eng',           '2 eng',             '🚤', '#fef08a', '{transport}',             '2-моторные катера', 22),
  ('Speedboat 3 eng',           '3 eng',             '🚤', '#bfdbfe', '{transport}',             '3-моторные катера', 23),
  ('Catamaran Milan',           'Catamaran',         '⛵', '#bbf7d0', '{transport}',             'Катамаран',         24),
  ('Royal Shark Center',        'Royal Shark',       '🦈', '#0ea5e9', '{shopping}',              'Здоровье из акулы', 30),
  ('Princess Jewerly',          'Princess J.',       '💎', '#fbcfe8', '{shopping}',              'Ювелирка',          31),
  ('Latex Factory',             'Latex',             '🛏', '#ddd6fe', '{shopping}',              'Латексные изделия', 32),
  ('Cashew Factory',            'Cashew',            '🥜', '#fcd34d', '{shopping}',              'Орехи кешью',       33),
  ('Pearl Farm',                'Pearl',             '🦪', '#a5f3fc', '{shopping}',              'Жемчуг',            34),
  ('Royal Aptek Moringa',       'Moringa',           '💊', '#86efac', '{shopping}',              'Тайская аптека',    35),
  ('Galleria Самоцветов',        'Galleria',          '💍', '#c4b5fd', '{shopping}',              'Драгоценности',     36),
  ('River Kwai Local Pharmacy', 'River Kwai',        '🌿', '#bef264', '{shopping}',              'Аптека Ривер Квай', 37),
  ('Khao Sok National Park',    'Khao Sok',          '🏞', '#10b981', '{location,stay}',         'Нацпарк, проживание', 40),
  ('Cheo Lan Floating Bungalows', 'Cheo Lan',        '🛖', '#22d3ee', '{stay,location}',         'Бунгало на воде',   41),
  ('Thai Airways',              'Thai Airways',      '✈️', '#a78bfa', '{transport}',             'Авиабилеты',         50),
  ('Bangkok Airways',           'Bangkok Air',       '✈️', '#fb923c', '{transport}',             'Авиабилеты',         51),
  ('Wat Suvankuha',             'Wat Suvankuha',     '⛩️', '#f59e0b', '{location}',              'Храм с обезьянами', 60),
  ('Wat Chalong',               'Wat Chalong',       '🛕', '#f59e0b', '{location}',              'Главный храм',       61),
  ('Big Buddha Phuket',         'Big Buddha',        '🛕', '#fbbf24', '{location}',              'Большой Будда',      62)
ON CONFLICT DO NOTHING;

SELECT 'Partners: ' || COUNT(*) || ' rows' AS msg FROM public.partners;
