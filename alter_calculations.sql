-- ============================================================
-- CALCULATIONS: RLS политики для новых функций
-- Запустить в Supabase > SQL Editor
-- ============================================================

-- Убедитесь что RLS включён на таблице calculations
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "calcs_insert"  ON public.calculations;
DROP POLICY IF EXISTS "calcs_select"  ON public.calculations;
DROP POLICY IF EXISTS "calcs_delete"  ON public.calculations;

-- Вставка: любой авторизованный пользователь (и анонимный для чартеров)
CREATE POLICY "calcs_insert" ON public.calculations
  FOR INSERT TO authenticated WITH CHECK (true);

-- Просмотр:
-- - Своих расчётов (created_by = текущий пользователь)
-- - ИЛИ роль booking видит все расчёты
-- - ИЛИ читает по ID (для публичных ссылок через anon key)
CREATE POLICY "calcs_select" ON public.calculations
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'booking'
    )
  );

-- Публичный доступ к расчётам по ID (для клиентских ссылок без логина)
CREATE POLICY "calcs_select_anon" ON public.calculations
  FOR SELECT TO anon
  USING (true);

-- Удаление: свой расчёт или роль booking
CREATE POLICY "calcs_delete" ON public.calculations
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'booking'
    )
  );
