-- ============================================================
-- SYNC AUTH.USERS → PROFILES
-- Corrige le bug AdminUsers (1 user affiché sur N)
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Synchroniser tous les comptes auth.users vers profiles
INSERT INTO profiles (id, email, role)
SELECT 
  u.id,
  u.email,
  'user'
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM profiles WHERE id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

-- 2. Mettre à jour les emails vides dans profiles depuis auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 3. Vérification : tous les comptes avec leur provider
SELECT 
  p.email, 
  p.role,
  p.first_name,
  p.last_name,
  u.raw_app_meta_data->>'provider' as provider,
  p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC;
