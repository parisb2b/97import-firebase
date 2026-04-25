import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useToast } from '../../components/Toast';

interface ClientInfo {
  userId: string;
  nom: string;
  email: string;
  destination: string;
  devisCount: number;
  totalHT: number;
  lastDevisDate: string;
  devis: DevisInfo[];
}

interface DevisInfo {
  id: string;
  numero: string;
  statut: string;
  total_ht: number;
  mainProduct: string;
  createdAt: any;
  acomptes: any[];
}

const STATUT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  nouveau: { bg: '#DBEAFE', color: '#1E40AF', label: 'Nouveau' },
  en_cours: { bg: '#FEF3C7', color: '#92400E', label: 'En cours' },
  accepte: { bg: '#DCFCE7', color: '#166534', label: 'Accepté' },
  vip_envoye: { bg: '#EDE9FE', color: '#7C3AED', label: 'VIP envoyé' },
  refuse: { bg: '#FEE2E2', color: '#991B1B', label: 'Refusé' },
  expire: { bg: '#F3F4F6', color: '#6B7280', label: 'Expiré' },
  en_preparation: { bg: '#FEF3C7', color: '#92400E', label: 'En préparation' },
  expedie: { bg: '#E0E7FF', color: '#3730A3', label: 'Expédié' },
  livre: { bg: '#DCFCE7', color: '#166534', label: 'Livré' },
};

export default function MesClientsPartner({ partnerCode }: { partnerCode: string }) {
  const { showToast } = useToast();
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'quotes'), where('partenaire_code', '==', partnerCode));
        const snap = await getDocs(q);
        const allDevis = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

        // Group by client
        const clientMap = new Map<string, any[]>();
        allDevis.forEach(d => {
          const cid = d.client_id || 'unknown';
          if (!clientMap.has(cid)) clientMap.set(cid, []);
          clientMap.get(cid)!.push(d);
        });

        // Build client infos
        const clientInfos: ClientInfo[] = [];
        for (const [cid, devs] of clientMap.entries()) {
          let profileData: any = {};
          try {
            const userSnap = await getDoc(doc(db, 'users', cid));
            if (userSnap.exists()) profileData = userSnap.data();
          } catch {}

          const sorted = devs.sort((a: any, b: any) =>
            (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
          );

          clientInfos.push({
            userId: cid,
            nom: devs[0]?.client_nom || profileData.firstName ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() : 'Client',
            email: devs[0]?.client_email || profileData.email || '',
            destination: profileData.pays || devs[0]?.pays_livraison || '—',
            devisCount: devs.length,
            totalHT: devs.reduce((s: number, d: any) => s + (d.total_ht || 0), 0),
            lastDevisDate: sorted[0]?.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—',
            devis: sorted.map((d: any) => ({
              id: d.id,
              numero: d.numero,
              statut: d.statut,
              total_ht: d.total_ht,
              mainProduct: d.lignes?.[0]?.nom_fr || 'Produit',
              createdAt: d.createdAt,
              acomptes: d.acomptes || [],
            })),
          });
        }

        clientInfos.sort((a, b) => b.totalHT - a.totalHT);
        setClients(clientInfos);
      } catch (err) {
        console.error(err);
        showToast('Erreur de chargement', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [partnerCode]);

  const filtered = clients.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.nom.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || c.destination.toLowerCase().includes(s);
  });

  // KPIs
  const totalClients = clients.length;
  const totalDevisActifs = clients.reduce((s, c) => s + c.devis.filter(d => d.statut !== 'expire' && d.statut !== 'refuse').length, 0);
  const caTotal = clients.reduce((s, c) => s + c.totalHT, 0);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginBottom: 4 }}>Mes clients</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Vue d'ensemble de tous vos clients et leurs devis.</p>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, background: '#DBEAFE', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#1E40AF' }}>Total clients</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#1E40AF' }}>{totalClients}</p>
        </div>
        <div style={{ flex: 1, background: '#FEF3C7', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#92400E' }}>Devis actifs</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#92400E' }}>{totalDevisActifs}</p>
        </div>
        <div style={{ flex: 1, background: '#DCFCE7', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#166534' }}>CA total</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#166534' }}>{caTotal.toLocaleString('fr-FR')} €</p>
        </div>
      </div>

      {/* Recherche */}
      <div style={{ marginBottom: 20 }}>
        <input type="text" placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 60, textAlign: 'center', color: '#6B7280' }}>
          {search ? 'Aucun client trouvé.' : 'Aucun client pour le moment.'}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px 100px 110px', padding: '12px 16px', borderBottom: '2px solid #E5E7EB', fontSize: 11, fontWeight: 600, color: '#6B7280' }}>
            <span>Client</span><span>Email</span><span>Destination</span><span>Nb devis</span><span>Total</span><span>Dernier devis</span>
          </div>

          {filtered.map(c => {
            const isOpen = expandedId === c.userId;
            const encaisse = c.devis.reduce((s, d) => s + (d.acomptes || []).filter((a: any) => a.encaisse === true).reduce((ss: number, a: any) => ss + a.montant, 0), 0);
            const devisEnCours = c.devis.filter(d => d.statut !== 'expire' && d.statut !== 'refuse' && d.statut !== 'livre').length;
            const cmdTotal = c.devis.filter(d => d.acomptes?.some((a: any) => a.encaisse === true)).length;

            return (
              <div key={c.userId}>
                <div onClick={() => setExpandedId(isOpen ? null : c.userId)}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px 100px 110px', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: 13, alignItems: 'center', background: isOpen ? '#F9FAFB' : '#fff' }}>
                  <span style={{ fontWeight: 600, color: '#1565C0' }}>{c.nom}</span>
                  <span style={{ color: '#6B7280', fontSize: 12 }}>{c.email}</span>
                  <span style={{ color: '#6B7280', fontSize: 12 }}>{c.destination}</span>
                  <span style={{ fontWeight: 700 }}>{c.devisCount}</span>
                  <span style={{ fontWeight: 700, color: '#1565C0' }}>{c.totalHT.toLocaleString('fr-FR')} €</span>
                  <span style={{ color: '#9CA3AF', fontSize: 11 }}>{c.lastDevisDate}</span>
                </div>

                {isOpen && (
                  <div style={{ padding: '16px 20px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    {/* Client KPIs */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                      <div style={{ flex: 1, background: '#DBEAFE', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#1E40AF' }}>Devis en cours</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#1E40AF' }}>{devisEnCours}</p>
                      </div>
                      <div style={{ flex: 1, background: '#FEF3C7', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#92400E' }}>Commandes</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#92400E' }}>{cmdTotal}</p>
                      </div>
                      <div style={{ flex: 1, background: '#DCFCE7', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#166534' }}>Encaissé</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#166534' }}>{encaisse.toLocaleString('fr-FR')} €</p>
                      </div>
                      <div style={{ flex: 1, background: '#FEE2E2', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#991B1B' }}>Solde restant</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#991B1B' }}>{(c.totalHT - encaisse).toLocaleString('fr-FR')} €</p>
                      </div>
                    </div>

                    {/* Devis list */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                          <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6B7280' }}>N° Devis</th>
                          <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6B7280' }}>Produit</th>
                          <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6B7280' }}>Statut</th>
                          <th style={{ textAlign: 'right', padding: '6px 8px', color: '#6B7280' }}>Total HT</th>
                          <th style={{ textAlign: 'right', padding: '6px 8px', color: '#6B7280' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.devis.map(d => {
                          const sc = STATUT_COLORS[d.statut] || { bg: '#F3F4F6', color: '#374151', label: d.statut };
                          return (
                            <tr key={d.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 600, color: '#1565C0' }}>{d.numero}</td>
                              <td style={{ padding: '6px 8px', color: '#374151' }}>{d.mainProduct}</td>
                              <td style={{ padding: '6px 8px' }}>
                                <span style={{ background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600 }}>{sc.label}</span>
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{d.total_ht?.toLocaleString('fr-FR')} €</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#9CA3AF' }}>{d.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
