import AdminLayout from './AdminLayout'
import { AdminCard, AdminCardHeader, ADMIN_COLORS } from '../../components/admin/AdminUI'

export default function AdminSuiviAchats() {
  return (
    <AdminLayout>
      <div style={{ padding: '24px', fontFamily: ADMIN_COLORS.font }}>
        <h1 style={{ fontSize: '18px', fontWeight: '700', color: ADMIN_COLORS.navy, marginBottom: '20px' }}>
          🛒 Suivi Achats
        </h1>
        <AdminCard>
          <AdminCardHeader>Export Excel fournisseur (22 colonnes)</AdminCardHeader>
          <div style={{ padding: '24px', color: ADMIN_COLORS.grayText, fontSize: '13px' }}>
            À implémenter — Phase 4
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  )
}
