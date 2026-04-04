import React from 'react'
import { useAdminAuth } from '../contexts/AuthContext'
import { Redirect } from 'wouter'

export function AdminGuard({
  children
}: { children: React.ReactNode }) {
  const { adminUser, adminLoading, isAdmin } =
    useAdminAuth()

  if (adminLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Inter,sans-serif',
        color: '#6B7280',
      }}>
        Chargement...
      </div>
    )
  }

  if (!adminUser || !isAdmin) {
    return <Redirect to="/admin/login" />
  }

  return <>{children}</>
}
