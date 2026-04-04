-- ============================================================
-- FIX RLS FINAL — 97import.com
-- À exécuter dans Supabase SQL Editor
-- Date : 2026-04-03
-- ============================================================
-- Problème : supabaseAdmin utilise ANON_KEY (pas SERVICE_ROLE_KEY)
-- → toutes les requêtes admin sont soumises à RLS
-- → sans policies correctes, les SELECT retournent 0 lignes
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. FONCTION is_admin() — évite la récursion dans les policies
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
-- 1. TABLE: quotes
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

-- Insertion anonyme (formulaire de devis sans compte)
DROP POLICY IF EXISTS "anon_insert_quotes" ON quotes;
CREATE POLICY "anon_insert_quotes" ON quotes
FOR INSERT TO anon
WITH CHECK (true);

-- Clients lisent leurs propres devis
DROP POLICY IF EXISTS "user_read_own_quotes" ON quotes;
CREATE POLICY "user_read_own_quotes" ON quotes
FOR SELECT TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 2. TABLE: partners
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

DROP POLICY IF EXISTS "Admin gere partenaires" ON partners;
DROP POLICY IF EXISTS "Partenaire voit ses infos" ON partners;

-- ─────────────────────────────────────────────────────────────
-- 3. TABLE: profiles
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_select_profiles" ON profiles;
CREATE POLICY "admin_select_profiles" ON profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles" ON profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "read_own_profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Insert (trigger handle_new_user + signup)
DROP POLICY IF EXISTS "admin_insert_profiles" ON profiles;
CREATE POLICY "admin_insert_profiles" ON profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid() OR is_admin());

-- ─────────────────────────────────────────────────────────────
-- 4. TABLE: invoices
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
-- 5. TABLE: site_content — LECTURE PUBLIQUE (CMS header/footer)
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_site_content" ON site_content;
CREATE POLICY "public_read_site_content" ON site_content
FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "admin_select_site_content" ON site_content;
DROP POLICY IF EXISTS "admin_update_site_content" ON site_content;
CREATE POLICY "admin_manage_site_content" ON site_content
FOR ALL TO authenticated
USING (is_admin());

-- ─────────────────────────────────────────────────────────────
-- 6. TABLE: contacts
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
-- 7. TABLE: products — lecture publique + écriture admin
-- ─────────────────────────────────────────────────────────────

-- Ne pas toucher à la policy de lecture publique existante
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
-- 8. TABLE: admin_params
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin gere params" ON admin_params;
DROP POLICY IF EXISTS "Public lecture params" ON admin_params;

CREATE POLICY "public_read_admin_params" ON admin_params
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "admin_manage_params" ON admin_params
FOR ALL TO authenticated
USING (is_admin());

-- ─────────────────────────────────────────────────────────────
-- 9. TABLE: delivery_notes (si existe)
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin gere bons livraison" ON delivery_notes;
DROP POLICY IF EXISTS "User voit ses bons livraison" ON delivery_notes;

CREATE POLICY "admin_manage_delivery_notes" ON delivery_notes
FOR ALL TO authenticated
USING (is_admin());

-- ─────────────────────────────────────────────────────────────
-- 10. TABLE: fees (si existe)
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin gere frais" ON fees;

CREATE POLICY "admin_manage_fees" ON fees
FOR ALL TO authenticated
USING (is_admin());

-- ─────────────────────────────────────────────────────────────
-- 11. TABLE: commission_notes (si existe)
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin gere commissions" ON commission_notes;
DROP POLICY IF EXISTS "Partenaire voit ses commissions" ON commission_notes;

CREATE POLICY "admin_manage_commissions" ON commission_notes
FOR ALL TO authenticated
USING (is_admin());

-- ============================================================
-- VÉRIFICATION — Exécuter après les policies
-- ============================================================
-- SELECT is_admin();  -- Doit retourner true si connecté en admin
-- SELECT * FROM quotes LIMIT 3;  -- Doit retourner des lignes
-- SELECT * FROM partners LIMIT 3;  -- Doit retourner des lignes
-- ============================================================
