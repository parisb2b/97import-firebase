-- ============================================================
-- ✅ POLICIES RLS COMPLÈTES — 97import admin
-- STATUT : EXÉCUTÉ LE 2026-04-03 dans Supabase SQL Editor
-- ============================================================
-- Diagnostic confirmé par test Node.js :
--   quotes=0, partners=0, profiles=0, site_content=0 (RLS bloque)
--   products=68 (pas de RLS ou policy publique existante)
-- Cause : supabaseAdmin utilise ANON_KEY, pas SERVICE_ROLE_KEY
-- Solution : policies RLS pour rôle authenticated + admin
-- ============================================================

-- === TABLE: quotes ===
CREATE POLICY IF NOT EXISTS "admin_select_quotes"
ON quotes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY IF NOT EXISTS "admin_update_quotes"
ON quotes FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY IF NOT EXISTS "admin_insert_quotes"
ON quotes FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- === TABLE: partners ===
CREATE POLICY IF NOT EXISTS "admin_select_partners"
ON partners FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY IF NOT EXISTS "admin_update_partners"
ON partners FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY IF NOT EXISTS "admin_insert_partners"
ON partners FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- === TABLE: profiles ===
CREATE POLICY IF NOT EXISTS "admin_select_profiles"
ON profiles FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM profiles p2
    WHERE p2.id = auth.uid()
    AND p2.role = 'admin'
  )
);

CREATE POLICY IF NOT EXISTS "admin_update_profiles"
ON profiles FOR UPDATE TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM profiles p2
    WHERE p2.id = auth.uid()
    AND p2.role = 'admin'
  )
);

-- === TABLE: invoices ===
CREATE POLICY IF NOT EXISTS "admin_select_invoices"
ON invoices FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY IF NOT EXISTS "admin_update_invoices"
ON invoices FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY IF NOT EXISTS "admin_insert_invoices"
ON invoices FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- === TABLE: site_content ===
CREATE POLICY IF NOT EXISTS "admin_select_site_content"
ON site_content FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY IF NOT EXISTS "admin_update_site_content"
ON site_content FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- === TABLE: contacts ===
CREATE POLICY IF NOT EXISTS "admin_select_contacts"
ON contacts FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- === TABLE: products (lecture publique déjà OK, sécuriser écriture) ===
CREATE POLICY IF NOT EXISTS "admin_update_products"
ON products FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY IF NOT EXISTS "admin_insert_products"
ON products FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================================
-- POLICIES MANQUANTES À AJOUTER SI NÉCESSAIRE :
-- - Collaborateur : ajouter AND profiles.role IN ('admin', 'collaborateur')
-- - Client lecture propres devis : WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
-- - Insertion anonyme (formulaire sans compte) : TO anon WITH CHECK (true)
-- ============================================================
