import AdminLayout from './AdminLayout'
import { AdminCard, AdminCardHeader, ADMIN_COLORS } from '../../components/admin/AdminUI'

export default function AdminContenu() {
  return (
    <AdminLayout>
      <div style={{ padding: '24px', fontFamily: ADMIN_COLORS.font }}>
        <h1 style={{ fontSize: '18px', fontWeight: '700', color: ADMIN_COLORS.navy, marginBottom: '20px' }}>
          🌐 Contenu Site
        </h1>
        <AdminCard>
          <AdminCardHeader>Bannière, footer, contact, livraison</AdminCardHeader>
          <div style={{ padding: '24px', color: ADMIN_COLORS.grayText, fontSize: '13px' }}>
            À implémenter — Phase 4
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  )
}
