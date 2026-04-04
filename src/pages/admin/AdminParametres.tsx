import AdminLayout from './AdminLayout'
import { AdminCard, AdminCardHeader, ADMIN_COLORS } from '../../components/admin/AdminUI'

export default function AdminParametres() {
  return (
    <AdminLayout>
      <div style={{ padding: '24px', fontFamily: ADMIN_COLORS.font }}>
        <h1 style={{ fontSize: '18px', fontWeight: '700', color: ADMIN_COLORS.navy, marginBottom: '20px' }}>
          ⚙️ Paramètres
        </h1>
        <AdminCard>
          <AdminCardHeader>RIBs, émetteurs, config acomptes</AdminCardHeader>
          <div style={{ padding: '24px', color: ADMIN_COLORS.grayText, fontSize: '13px' }}>
            À implémenter — Phase 4
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  )
}
