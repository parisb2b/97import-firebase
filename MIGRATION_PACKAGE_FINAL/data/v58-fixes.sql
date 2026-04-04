-- ═══════════════════════════════════════════════════════
-- v5.8 SQL — Contraintes + Références internes + Invoices
-- ⚠️ EXÉCUTER DANS SUPABASE SQL EDITOR
-- ═══════════════════════════════════════════════════════

-- Contrainte UNIQUE sur partners.user_id
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS user_id UUID
    REFERENCES profiles(id);

CREATE UNIQUE INDEX IF NOT EXISTS partners_user_id_unique
  ON partners(user_id)
  WHERE user_id IS NOT NULL;

-- Ajouter colonne type_paiement dans invoices
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS type_paiement TEXT
    CHECK (type_paiement IN ('pro','perso'));

-- Ajouter colonnes acomptes/totaux dans quotes
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS acomptes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total_encaisse NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS solde_restant NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Ajouter envoye_client sur invoices, fees, delivery_notes
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS envoye_client BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;
DO $$ BEGIN
  ALTER TABLE fees ADD COLUMN IF NOT EXISTS envoye_client BOOLEAN DEFAULT false;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE IF NOT EXISTS fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES quotes(id),
    type TEXT CHECK (type IN ('maritime','dedouanement')),
    montant NUMERIC DEFAULT 0,
    envoye_client BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  );
END $$;
DO $$ BEGIN
  ALTER TABLE delivery_notes ADD COLUMN IF NOT EXISTS envoye_client BOOLEAN DEFAULT false;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE IF NOT EXISTS delivery_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES quotes(id),
    numero_bl TEXT,
    envoye_client BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  );
END $$;

-- Contrainte UNIQUE numero_facture pour upsert
CREATE UNIQUE INDEX IF NOT EXISTS invoices_numero_facture_unique
  ON invoices(numero_facture);

-- ═══════════════════════════════════════════════════════
-- 68 références internes produits
-- ═══════════════════════════════════════════════════════

-- Mini-pelles
UPDATE products SET reference_interne = 'MP-R18-001' WHERE nom ILIKE '%R18 PRO%';
UPDATE products SET reference_interne = 'MP-R22-001' WHERE nom ILIKE '%R22 PRO%';
UPDATE products SET reference_interne = 'MP-R32-001' WHERE nom ILIKE '%R32 PRO%';
UPDATE products SET reference_interne = 'MP-R57-001' WHERE nom ILIKE '%R57 PRO%';

-- Maisons container
UPDATE products SET reference_interne = 'MS-20-001' WHERE nom ILIKE '%Standard%20 Pieds%';
UPDATE products SET reference_interne = 'MS-30-001' WHERE nom ILIKE '%Standard%30 Pieds%';
UPDATE products SET reference_interne = 'MS-40-001' WHERE nom ILIKE '%Standard%40 Pieds%';
UPDATE products SET reference_interne = 'MP-20-001' WHERE nom ILIKE '%Premium%20 Pieds%';
UPDATE products SET reference_interne = 'MP-30-001' WHERE nom ILIKE '%Premium%30 Pieds%';
UPDATE products SET reference_interne = 'MP-40-001' WHERE nom ILIKE '%Premium%40 Pieds%';

-- Options
UPDATE products SET reference_interne = 'OPT-AC-001' WHERE nom ILIKE '%Climatisation%';
UPDATE products SET reference_interne = 'OPT-SOL-001' WHERE nom ILIKE '%Panneaux Solaires Maison%';
UPDATE products SET reference_interne = 'CC-BYD-001' WHERE nom ILIKE '%Camping Car%';

-- Kits solaires
UPDATE products SET reference_interne = 'KS-10K-001' WHERE nom ILIKE '%10 kW%' OR nom ILIKE '%10kW%';
UPDATE products SET reference_interne = 'KS-12K-001' WHERE nom ILIKE '%12 kW%' OR nom ILIKE '%12kW%';
UPDATE products SET reference_interne = 'KS-20K-001' WHERE nom ILIKE '%20 kW%' OR nom ILIKE '%20kW%';

-- Godets à dents
UPDATE products SET reference_interne = 'ACC-GD-001' WHERE nom ILIKE '%dents%R22%20cm%';
UPDATE products SET reference_interne = 'ACC-GD-002' WHERE nom ILIKE '%dents%R22%60cm%';
UPDATE products SET reference_interne = 'ACC-GD-003' WHERE nom ILIKE '%dents%R22%80cm%';
UPDATE products SET reference_interne = 'ACC-GD-004' WHERE nom ILIKE '%dents%R32%20cm%';
UPDATE products SET reference_interne = 'ACC-GD-005' WHERE nom ILIKE '%dents%R32%60cm%';
UPDATE products SET reference_interne = 'ACC-GD-006' WHERE nom ILIKE '%dents%R32%80cm%';
UPDATE products SET reference_interne = 'ACC-GD-007' WHERE nom ILIKE '%dents%R57%20cm%';
UPDATE products SET reference_interne = 'ACC-GD-008' WHERE nom ILIKE '%dents%R57%60cm%';
UPDATE products SET reference_interne = 'ACC-GD-009' WHERE nom ILIKE '%dents%R57%80cm%';
UPDATE products SET reference_interne = 'ACC-GD-010' WHERE nom ILIKE '%dents%R57%100cm%';
UPDATE products SET reference_interne = 'ACC-GD-011' WHERE nom ILIKE '%dents%R57%120cm%';

-- Godets de curage
UPDATE products SET reference_interne = 'ACC-GC-001' WHERE nom ILIKE '%curage%R22%30cm%';
UPDATE products SET reference_interne = 'ACC-GC-002' WHERE nom ILIKE '%curage%R22%60cm%';
UPDATE products SET reference_interne = 'ACC-GC-003' WHERE nom ILIKE '%curage%R22%80cm%';
UPDATE products SET reference_interne = 'ACC-GC-004' WHERE nom ILIKE '%curage%R22%100cm%';
UPDATE products SET reference_interne = 'ACC-GC-005' WHERE nom ILIKE '%curage%R32%30cm%';
UPDATE products SET reference_interne = 'ACC-GC-006' WHERE nom ILIKE '%curage%R32%60cm%';
UPDATE products SET reference_interne = 'ACC-GC-007' WHERE nom ILIKE '%curage%R32%80cm%';
UPDATE products SET reference_interne = 'ACC-GC-008' WHERE nom ILIKE '%curage%R32%100cm%';
UPDATE products SET reference_interne = 'ACC-GC-009' WHERE nom ILIKE '%curage%R57%30cm%';
UPDATE products SET reference_interne = 'ACC-GC-010' WHERE nom ILIKE '%curage%R57%60cm%';
UPDATE products SET reference_interne = 'ACC-GC-011' WHERE nom ILIKE '%curage%R57%80cm%';
UPDATE products SET reference_interne = 'ACC-GC-012' WHERE nom ILIKE '%curage%R57%100cm%';

-- Godets inclinables
UPDATE products SET reference_interne = 'ACC-GI-001' WHERE nom ILIKE '%inclinable%R22%80cm%';
UPDATE products SET reference_interne = 'ACC-GI-002' WHERE nom ILIKE '%inclinable%R22%100cm%';
UPDATE products SET reference_interne = 'ACC-GI-003' WHERE nom ILIKE '%inclinable%R32%80cm%';
UPDATE products SET reference_interne = 'ACC-GI-004' WHERE nom ILIKE '%inclinable%R32%100cm%';
UPDATE products SET reference_interne = 'ACC-GI-005' WHERE nom ILIKE '%inclinable%R57%80cm%';
UPDATE products SET reference_interne = 'ACC-GI-006' WHERE nom ILIKE '%inclinable%R57%100cm%';

-- Attaches rapides
UPDATE products SET reference_interne = 'ACC-AR-001' WHERE nom ILIKE '%Attache%R22%';
UPDATE products SET reference_interne = 'ACC-AR-002' WHERE nom ILIKE '%Attache%R32%';

-- Pinces
UPDATE products SET reference_interne = 'ACC-PP-001' WHERE nom ILIKE '%Pince%R22%';
UPDATE products SET reference_interne = 'ACC-PP-002' WHERE nom ILIKE '%Pince%R32%';

-- Râteaux
UPDATE products SET reference_interne = 'ACC-RT-001' WHERE nom ILIKE '%teau%R22%40cm%';
UPDATE products SET reference_interne = 'ACC-RT-002' WHERE nom ILIKE '%teau%R22%60cm%';
UPDATE products SET reference_interne = 'ACC-RT-003' WHERE nom ILIKE '%teau%R22%80cm%';
UPDATE products SET reference_interne = 'ACC-RT-004' WHERE nom ILIKE '%teau%R32%40cm%';
UPDATE products SET reference_interne = 'ACC-RT-005' WHERE nom ILIKE '%teau%R32%60cm%';
UPDATE products SET reference_interne = 'ACC-RT-006' WHERE nom ILIKE '%teau%R32%80cm%';
UPDATE products SET reference_interne = 'ACC-RT-007' WHERE nom ILIKE '%teau%R57%40cm%';
UPDATE products SET reference_interne = 'ACC-RT-008' WHERE nom ILIKE '%teau%R57%60cm%';
UPDATE products SET reference_interne = 'ACC-RT-009' WHERE nom ILIKE '%teau%R57%80cm%';

-- Rippers
UPDATE products SET reference_interne = 'ACC-RP-001' WHERE nom ILIKE '%Ripper%R22%';
UPDATE products SET reference_interne = 'ACC-RP-002' WHERE nom ILIKE '%Ripper%R32%';

-- Marteaux hydrauliques
UPDATE products SET reference_interne = 'ACC-MH-001' WHERE nom ILIKE '%Marteau%R22%';
UPDATE products SET reference_interne = 'ACC-MH-002' WHERE nom ILIKE '%Marteau%R32%';
UPDATE products SET reference_interne = 'ACC-MH-003' WHERE nom ILIKE '%Marteau%R57%';

-- Tarières
UPDATE products SET reference_interne = 'ACC-TA-001' WHERE nom ILIKE '%Tari%R22%';
UPDATE products SET reference_interne = 'ACC-TA-002' WHERE nom ILIKE '%Tari%R32%';

-- Grappins
UPDATE products SET reference_interne = 'ACC-GP-001' WHERE nom ILIKE '%Grappin%R22%';
UPDATE products SET reference_interne = 'ACC-GP-002' WHERE nom ILIKE '%Grappin%R32%';
UPDATE products SET reference_interne = 'ACC-GP-003' WHERE nom ILIKE '%Grappin%R57%';

-- Vérification
SELECT reference_interne, nom FROM products
WHERE reference_interne IS NOT NULL
ORDER BY reference_interne;
