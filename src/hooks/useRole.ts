import { useAuth } from '@/contexts/AuthContext'

export type UserRole = 'admin' | 'partner' | 'vip' | 'user' | 'public'

export function useRole(): UserRole {
  const { user, profile } = useAuth()

  if (!user) return 'public'
  if (!profile?.role) return 'user'

  const validRoles: UserRole[] = ['admin', 'partner', 'vip', 'user']
  if (validRoles.includes(profile.role as UserRole)) {
    return profile.role as UserRole
  }

  return 'user'
}
