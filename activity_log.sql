-- ============================================================
-- ACTIVITY LOG: таблица + триггеры
-- Запустить в Supabase > SQL Editor
-- ============================================================

-- 1. Таблица логов
CREATE TABLE IF NOT EXISTS public.activity_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action     TEXT        NOT NULL,
  details    JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action  ON public.activity_log (action);
CREATE INDEX IF NOT EXISTS idx_activity_log_user    ON public.activity_log (user_id);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_select" ON public.activity_log;
DROP POLICY IF EXISTS "logs_insert" ON public.activity_log;
CREATE POLICY "logs_select" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "logs_insert" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (true);


-- 2. Функция для триггеров
CREATE OR REPLACE FUNCTION public.log_table_change()
RETURNS TRIGGER AS $$
DECLARE
  action_name TEXT;
  detail_data JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_name := 'db_insert_' || TG_TABLE_NAME;
    detail_data := jsonb_build_object('table', TG_TABLE_NAME, 'op', 'INSERT', 'new', row_to_json(NEW)::jsonb);
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := 'db_update_' || TG_TABLE_NAME;
    detail_data := jsonb_build_object('table', TG_TABLE_NAME, 'op', 'UPDATE', 'new', row_to_json(NEW)::jsonb, 'old', row_to_json(OLD)::jsonb);
  ELSIF TG_OP = 'DELETE' THEN
    action_name := 'db_delete_' || TG_TABLE_NAME;
    detail_data := jsonb_build_object('table', TG_TABLE_NAME, 'op', 'DELETE', 'old', row_to_json(OLD)::jsonb);
  END IF;

  INSERT INTO public.activity_log (user_id, action, details)
  VALUES (auth.uid(), action_name, detail_data);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Триггеры на таблицы цен
DROP TRIGGER IF EXISTS trg_log_packages ON public.packages;
CREATE TRIGGER trg_log_packages
  AFTER INSERT OR UPDATE OR DELETE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

DROP TRIGGER IF EXISTS trg_log_options ON public.options;
CREATE TRIGGER trg_log_options
  AFTER INSERT OR UPDATE OR DELETE ON public.options
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

DROP TRIGGER IF EXISTS trg_log_charter ON public.charter_config;
CREATE TRIGGER trg_log_charter
  AFTER INSERT OR UPDATE OR DELETE ON public.charter_config
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();
