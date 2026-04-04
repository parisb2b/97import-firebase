-- add-address-columns.sql
-- Ajoute les colonnes d'adresses facturation/livraison dans la table profiles
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase
-- https://supabase.com/dashboard → SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS adresse_facturation        TEXT,
  ADD COLUMN IF NOT EXISTS ville_facturation          TEXT,
  ADD COLUMN IF NOT EXISTS cp_facturation             TEXT,
  ADD COLUMN IF NOT EXISTS pays_facturation           TEXT DEFAULT 'France',
  ADD COLUMN IF NOT EXISTS adresse_livraison          TEXT,
  ADD COLUMN IF NOT EXISTS ville_livraison            TEXT,
  ADD COLUMN IF NOT EXISTS cp_livraison               TEXT,
  ADD COLUMN IF NOT EXISTS pays_livraison             TEXT DEFAULT 'France',
  ADD COLUMN IF NOT EXISTS adresse_livraison_identique BOOLEAN DEFAULT true;

-- Vérification
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND (column_name LIKE '%facturation%' OR column_name LIKE '%livraison%')
ORDER BY column_name;
