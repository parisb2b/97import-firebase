-- ============================================================
-- 97import.com — Setup Partenaires & Commissions
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Séquence pour numéros de devis automatiques
CREATE SEQUENCE IF NOT EXISTS devis_numero_seq START 1;

CREATE OR REPLACE FUNCTION get_next_devis_numero()
RETURNS TEXT AS $$
DECLARE
  next_val INTEGER;
  annee TEXT;
BEGIN
  next_val := nextval('devis_numero_seq');
  annee := to_char(NOW(), 'YY');
  RETURN 'D' || annee || LPAD(next_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Table partenaires
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  user_id UUID REFERENCES profiles(id),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admin gere partenaires" ON partners
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'collaborateur'))
  );

CREATE POLICY IF NOT EXISTS "Partenaire voit ses infos" ON partners
  FOR SELECT USING (auth.uid() = user_id);

-- 3. ADMINISTRATEUR par défaut (non supprimable)
INSERT INTO partners (id, nom, email, actif)
VALUES ('00000000-0000-0000-0000-000000000001', 'ADMINISTRATEUR', 'parisb2b@gmail.com', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Colonnes devis pour partenaires/commissions
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id),
  ADD COLUMN IF NOT EXISTS commission_montant DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS commission_payee BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_pdf_url TEXT;

-- 5. Colonnes devis PDF/facture
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS numero_devis TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS facture_url TEXT,
  ADD COLUMN IF NOT EXISTS facture_generee BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS adresse_client TEXT,
  ADD COLUMN IF NOT EXISTS ville_client TEXT,
  ADD COLUMN IF NOT EXISTS pays_client TEXT DEFAULT 'France',
  ADD COLUMN IF NOT EXISTS signature_client TEXT,
  ADD COLUMN IF NOT EXISTS signe_le TIMESTAMPTZ;

-- 6. Table site_content pour le CMS
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "admin_full_site_content" ON site_content
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','collaborateur'))
  );

CREATE POLICY IF NOT EXISTS "public_read_site_content" ON site_content
  FOR SELECT USING (true);

-- 7. Attribuer les devis VIP existants à ADMINISTRATEUR
UPDATE quotes
SET partner_id = '00000000-0000-0000-0000-000000000001'
WHERE partner_id IS NULL AND role_client = 'vip';

-- ============================================================
-- FIN — Vérification :
-- SELECT * FROM partners;
-- SELECT column_name FROM information_schema.columns WHERE table_name='quotes';
-- ============================================================
