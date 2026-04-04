-- ============================================================
-- TRIGGER : Création automatique de profil à l'inscription
-- Résout le bug : comptes Google OAuth sans ligne dans profiles
-- À exécuter UNE FOIS dans Supabase SQL Editor
-- ============================================================

-- 1. Fonction déclenchée à chaque nouvel utilisateur auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 1), ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULLIF(SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 2), ''), ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(NULLIF(profiles.first_name, ''), EXCLUDED.first_name),
    last_name = COALESCE(NULLIF(profiles.last_name, ''), EXCLUDED.last_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger sur auth.users AFTER INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Synchroniser les comptes existants sans profil (rattrapage)
INSERT INTO profiles (id, email, first_name, last_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', SPLIT_PART(COALESCE(u.raw_user_meta_data->>'full_name', ''), ' ', 1), ''),
  COALESCE(u.raw_user_meta_data->>'last_name', NULLIF(SPLIT_PART(COALESCE(u.raw_user_meta_data->>'full_name', ''), ' ', 2), ''), ''),
  'user'
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM profiles WHERE id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

-- 4. Vérification
SELECT
  p.email,
  p.first_name,
  p.last_name,
  p.role,
  u.raw_app_meta_data->>'provider' AS provider,
  p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC;
