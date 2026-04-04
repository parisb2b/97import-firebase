-- ============================================================
-- FIX RLS V2 — 97import.com
-- À exécuter dans Supabase SQL Editor
-- Date : 2026-04-03
-- ============================================================
-- Complète fix-rls-final.sql avec :
--   - Policy lecture publique products (catalogue)
--   - Enable RLS sur toutes les tables (au cas où désactivé)
--   - Vérification is_admin() fonctionne
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. FONCTION is_admin() — rappel (idempotent)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'collaborateur')
  )
$$;

-- ─────────────────────────────────────────────────────────────
-- 1. ENABLE RLS sur toutes les tables
-- ─────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_params ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS site_content ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 2. PRODUCTS — lecture publique (catalogue visible sans auth)
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products
FOR SELECT TO anon, authenticated
USING (true);

-- Admin CRUD
DROP POLICY IF EXISTS "admin_select_products" ON products;
CREATE POLICY "admin_select_products" ON products
FOR SELECT TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products" ON products
FOR UPDATE TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products" ON products
FOR INSERT TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products" ON products
FOR DELETE TO authenticated
USING (is_admin());

-- ─────────────────────────────────────────────────────────────
-- 3. QUOTES — SELECT pour admin + owner + insert anon
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_select_quotes" ON quotes;
CREATE POLICY "admin_select_quotes" ON quotes
FOR SELECT TO authenticated
USING (is_admin() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "admin_update_quotes" ON quotes;
CREATE POLICY "admin_update_quotes" ON quotes
FOR UPDATE TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "admin_insert_quotes" ON quotes;
CREATE POLICY "admin_insert_quotes" ON quotes
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_quotes" ON quotes;
CREATE POLICY "admin_delete_quotes" ON quotes
FOR DELETE TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "anon_insert_quotes" ON quotes;
CREATE POLICY "anon_insert_quotes" ON quotes
FOR INSERT TO anon
WITH CHECK (true);

-- Nettoyage anciennes policies
DROP POLICY IF EXISTS "user_read_own_quotes" ON quotes;

-- ─────────────────────────────────────────────────────────────
-- 4. PROFILES
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_select_profiles" ON profiles;
CREATE POLICY "admin_select_profiles" ON profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles" ON profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "admin_insert_profiles" ON profiles;
CREATE POLICY "admin_insert_profiles" ON profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid() OR is_admin());

-- Nettoyage
DROP POLICY IF EXISTS "read_own_profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- ─────────────────────────────────────────────────────────────
-- 5. PARTNERS
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_select_partners" ON partners;
CREATE POLICY "admin_select_partners" ON partners
FOR SELECT TO authenticated
USING (is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "admin_update_partners" ON partners;
CREATE POLICY "admin_update_partners" ON partners
FOR UPDATE TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "admin_insert_partners" ON partners;
CREATE POLICY "admin_insert_partners" ON partners
FOR INSERT TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_partners" ON partners;
CREATE POLICY "admin_delete_partners" ON partners
FOR DELETE TO authenticated
USING (is_admin());

-- Nettoyage
DROP POLICY IF EXISTS "Admin gere partenaires" ON partners;
DROP POLICY IF EXISTS "Partenaire voit ses infos" ON partners;

-- ─────────────────────────────────────────────────────────────
-- 6. INVOICES
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_select_invoices" ON invoices;
CREATE POLICY "admin_select_invoices" ON invoices
FOR SELECT TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "admin_update_invoices" ON invoices;
CREATE POLICY "admin_update_invoices" ON invoices
FOR UPDATE TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "admin_insert_invoices" ON invoices;
CREATE POLICY "admin_insert_invoices" ON invoices
FOR INSERT TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin gere factures" ON invoices;
DROP POLICY IF EXISTS "User voit ses factures" ON invoices;

-- ─────────────────────────────────────────────────────────────
-- 7. SITE_CONTENT — lecture publique + admin manage
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_site_content" ON site_content;
CREATE POLICY "public_read_site_content" ON site_content
FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "admin_manage_site_content" ON site_content;
DROP POLICY IF EXISTS "admin_select_site_content" ON site_content;
DROP POLICY IF EXISTS "admin_update_site_content" ON site_content;
CREATE POLICY "admin_manage_site_content" ON site_content
FOR ALL TO authenticated
USING (is_admin());

-- ─────────────────────────────────────────────────────────────
-- 8. CONTACTS — insert public + admin read
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_select_contacts" ON contacts;
CREATE POLICY "admin_select_contacts" ON contacts
FOR SELECT TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "anon_insert_contacts" ON contacts;
CREATE POLICY "anon_insert_contacts" ON contacts
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 9. ADMIN_PARAMS — lecture publique + admin manage
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_admin_params" ON admin_params;
DROP POLICY IF EXISTS "admin_manage_params" ON admin_params;
DROP POLICY IF EXISTS "Admin gere params" ON admin_params;
DROP POLICY IF EXISTS "Public lecture params" ON admin_params;

CREATE POLICY "public_read_admin_params" ON admin_params
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "admin_manage_params" ON admin_params
FOR ALL TO authenticated
USING (is_admin());

-- ─────────────────────────────────────────────────────────────
-- 10. DELIVERY_NOTES
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_manage_delivery_notes" ON delivery_notes;
DROP POLICY IF EXISTS "Admin gere bons livraison" ON delivery_notes;
DROP POLICY IF EXISTS "User voit ses bons livraison" ON delivery_notes;

CREATE POLICY "admin_manage_delivery_notes" ON delivery_notes
FOR ALL TO authenticated
USING (is_admin());

-- ─────────────────────────────────────────────────────────────
-- 11. FEES
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_manage_fees" ON fees;
DROP POLICY IF EXISTS "Admin gere frais" ON fees;

CREATE POLICY "admin_manage_fees" ON fees
FOR ALL TO authenticated
USING (is_admin());

-- ============================================================
-- VÉRIFICATION — Exécuter après les policies
-- ============================================================
-- SELECT is_admin();                -- true si connecté en admin
-- SELECT count(*) FROM quotes;     -- doit retourner > 0
-- SELECT count(*) FROM profiles;   -- doit retourner > 0
-- SELECT count(*) FROM partners;   -- doit retourner > 0
-- SELECT count(*) FROM products;   -- doit retourner > 0
-- ============================================================
