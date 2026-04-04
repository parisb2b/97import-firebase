-- ============================================================
-- CREATE TABLE error_logs — 97import.com
-- À exécuter dans Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT,
  context TEXT,
  user_email TEXT,
  stack_trace TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS : lecture/écriture admin + insert anon/authenticated (pour le logger client)
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_error_logs" ON error_logs;
CREATE POLICY "admin_manage_error_logs" ON error_logs
FOR ALL TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "anyone_insert_error_logs" ON error_logs;
CREATE POLICY "anyone_insert_error_logs" ON error_logs
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs (resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs (created_at DESC);
