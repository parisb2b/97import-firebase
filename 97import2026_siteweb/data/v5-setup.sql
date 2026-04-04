-- ============================================================
-- 97import.com — V5.0 Setup SQL
-- À exécuter dans Supabase SQL Editor
-- Prérequis : setup-partners.sql déjà exécuté
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. TABLE invoices (Factures)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_facture TEXT UNIQUE NOT NULL,
  quote_id UUID REFERENCES quotes(id),
  user_id UUID REFERENCES auth.users(id),
  date_facture DATE DEFAULT CURRENT_DATE,
  montant_ht DECIMAL(12,2) NOT NULL,
  montant_acompte DECIMAL(12,2) DEFAULT 0,
  type_facture TEXT DEFAULT 'standard' CHECK (type_facture IN ('standard', 'acompte', 'solde')),
  numero_acompte INTEGER DEFAULT 0,
  statut TEXT DEFAULT 'emise' CHECK (statut IN ('emise', 'payee', 'annulee')),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invoices_quote_id_idx ON invoices(quote_id);
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_numero_idx ON invoices(numero_facture);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gere factures" ON invoices
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'collaborateur'))
  );

CREATE POLICY "User voit ses factures" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

-- Séquence numéros factures : FA[YY][XXXXX]
CREATE SEQUENCE IF NOT EXISTS facture_numero_seq START 1;

CREATE OR REPLACE FUNCTION get_next_facture_numero()
RETURNS TEXT AS $$
DECLARE
  next_val INTEGER;
  annee TEXT;
BEGIN
  next_val := nextval('facture_numero_seq');
  annee := to_char(NOW(), 'YY');
  RETURN 'FA' || annee || LPAD(next_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 2. TABLE delivery_notes (Bons de livraison)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_bl TEXT UNIQUE NOT NULL,
  quote_id UUID REFERENCES quotes(id),
  user_id UUID REFERENCES auth.users(id),
  date_livraison DATE DEFAULT CURRENT_DATE,
  adresse_livraison TEXT,
  ville_livraison TEXT,
  pays_livraison TEXT DEFAULT 'France',
  produits JSONB,
  notes TEXT,
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'livre')),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS delivery_notes_quote_id_idx ON delivery_notes(quote_id);

ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gere bons livraison" ON delivery_notes
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'collaborateur'))
  );

CREATE POLICY "User voit ses bons livraison" ON delivery_notes
  FOR SELECT USING (auth.uid() = user_id);

-- Séquence numéros BL : BL[YY][XXXXX]
CREATE SEQUENCE IF NOT EXISTS bl_numero_seq START 1;

CREATE OR REPLACE FUNCTION get_next_bl_numero()
RETURNS TEXT AS $$
DECLARE
  next_val INTEGER;
  annee TEXT;
BEGIN
  next_val := nextval('bl_numero_seq');
  annee := to_char(NOW(), 'YY');
  RETURN 'BL' || annee || LPAD(next_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 3. TABLE fees (Frais : maritimes FM + dédouanement DD)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_document TEXT UNIQUE NOT NULL,
  quote_id UUID REFERENCES quotes(id),
  type_frais TEXT NOT NULL CHECK (type_frais IN ('maritime', 'dedouanement')),
  date_document DATE DEFAULT CURRENT_DATE,
  montant_ht DECIMAL(12,2) NOT NULL,
  description TEXT,
  details JSONB,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fees_quote_id_idx ON fees(quote_id);
CREATE INDEX IF NOT EXISTS fees_type_idx ON fees(type_frais);

ALTER TABLE fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gere frais" ON fees
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'collaborateur'))
  );

-- Séquences : FM[YY][XXXXX] et DD[YY][XXXXX]
CREATE SEQUENCE IF NOT EXISTS fm_numero_seq START 1;
CREATE SEQUENCE IF NOT EXISTS dd_numero_seq START 1;

CREATE OR REPLACE FUNCTION get_next_fm_numero()
RETURNS TEXT AS $$
BEGIN
  RETURN 'FM' || to_char(NOW(), 'YY') || LPAD(nextval('fm_numero_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_next_dd_numero()
RETURNS TEXT AS $$
BEGIN
  RETURN 'DD' || to_char(NOW(), 'YY') || LPAD(nextval('dd_numero_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 4. TABLE commission_notes (Notes de commission)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commission_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_commission TEXT UNIQUE NOT NULL,
  partner_id UUID REFERENCES partners(id),
  quote_id UUID REFERENCES quotes(id),
  date_commission DATE DEFAULT CURRENT_DATE,
  montant_commission DECIMAL(12,2) NOT NULL,
  statut TEXT DEFAULT 'emise' CHECK (statut IN ('emise', 'payee')),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS commission_notes_partner_id_idx ON commission_notes(partner_id);
CREATE INDEX IF NOT EXISTS commission_notes_quote_id_idx ON commission_notes(quote_id);

ALTER TABLE commission_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gere commissions" ON commission_notes
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'collaborateur'))
  );

CREATE POLICY "Partenaire voit ses commissions" ON commission_notes
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM partners WHERE id = commission_notes.partner_id)
  );

-- Séquence : NC[YY][XXXXX]
CREATE SEQUENCE IF NOT EXISTS nc_numero_seq START 1;

CREATE OR REPLACE FUNCTION get_next_nc_numero()
RETURNS TEXT AS $$
BEGIN
  RETURN 'NC' || to_char(NOW(), 'YY') || LPAD(nextval('nc_numero_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 5. Enrichir table products (colonnes supplémentaires)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS reference_interne TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS prix_public DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS poids_kg DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS dimensions TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS ordre INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─────────────────────────────────────────────────────────────
-- 6. Enrichir table quotes (colonnes acomptes + suivi)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS acompte_pourcentage DECIMAL(5,2) DEFAULT 30,
  ADD COLUMN IF NOT EXISTS acompte_paye BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS solde_paye BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS date_livraison_prevue DATE,
  ADD COLUMN IF NOT EXISTS notes_internes TEXT,
  ADD COLUMN IF NOT EXISTS bl_genere BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_client TEXT,
  ADD COLUMN IF NOT EXISTS telephone_client TEXT;

-- ─────────────────────────────────────────────────────────────
-- 7. Table admin_params (paramètres système)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_params (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  label TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_params ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gere params" ON admin_params
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'collaborateur'))
  );

CREATE POLICY "Public lecture params" ON admin_params
  FOR SELECT USING (true);

-- Valeurs par défaut
INSERT INTO admin_params (key, value, label) VALUES
  ('emetteur', '{"nom": "97 IMPORT", "adresse": "123 rue Example", "ville": "75001 Paris", "pays": "France", "email": "contact@97import.com", "telephone": "+33 1 23 45 67 89", "siret": "XXX XXX XXX XXXXX", "tva_intra": "FRXX XXXXXXXXX"}', 'Informations émetteur'),
  ('rib', '{"banque": "Banque Example", "iban": "FR76 XXXX XXXX XXXX XXXX XXXX XXX", "bic": "XXXXXXXX"}', 'Coordonnées bancaires (RIB)'),
  ('acompte_defaut', '{"pourcentage": 30}', 'Pourcentage acompte par défaut'),
  ('multiplicateurs', '{"user": 2, "partner": 1.2, "vip": 1.3}', 'Multiplicateurs prix par rôle')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 8. Buckets Storage pour documents
-- ─────────────────────────────────────────────────────────────
-- À exécuter via Supabase Dashboard > Storage > Create bucket :
-- - media/factures/
-- - media/bons-livraison/
-- - media/frais/
-- - media/commissions/
-- (Les buckets media/devis/ existent déjà depuis v4)

-- ============================================================
-- FIN V5 — Vérifications :
-- SELECT * FROM invoices LIMIT 0;
-- SELECT * FROM delivery_notes LIMIT 0;
-- SELECT * FROM fees LIMIT 0;
-- SELECT * FROM commission_notes LIMIT 0;
-- SELECT * FROM admin_params;
-- SELECT column_name FROM information_schema.columns WHERE table_name='products';
-- SELECT column_name FROM information_schema.columns WHERE table_name='quotes';
-- ============================================================
