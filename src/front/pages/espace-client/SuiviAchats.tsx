import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface Devis {
  id: string;
  numero: string;
  conteneur_id?: string;
  statut_commande?: string;
  lignes: { nom_fr: string }[];
  createdAt: any;
}

const TIMELINE_STEPS = [
  { id: 'preparation', label: 'Préparation', icon: '📦' },
  { id: 'charge', label: 'Chargé', icon: '🏗️' },
  { id: 'en_mer', label: 'En mer', icon: '🚢' },
  { id: 'arrive', label: 'Arrivé', icon: '⚓' },
  { id: 'livre', label: 'Livré', icon: '✅' },
];

const STATUT_TO_STEP: Record<string, number> = {
  en_preparation: 0,
  charge: 1,
  en_mer: 2,
  arrive: 3,
  livre: 4,
};

export default function SuiviAchats({ userId }: { userId: string }) {
  const [expeditions, setExpeditions] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'quotes'), where('client_id', '==', userId));
        const snap = await getDocs(q);
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Devis))
          .filter(d => d.conteneur_id)
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setExpeditions(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginBottom: 4 }}>Suivre mes achats</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Suivez l'avancement de vos expéditions en temps réel.</p>

      {expeditions.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 60, textAlign: 'center', color: '#6B7280', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          🚚 Aucune expédition en cours.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {expeditions.map(d => {
            const currentStep = STATUT_TO_STEP[d.statut_commande || 'en_preparation'] ?? 0;
            return (
              <div key={d.id} style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#1565C0', fontSize: 14 }}>CMD-{d.numero?.replace(/^DVS-/, '')}</span>
                    <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{d.lignes?.[0]?.nom_fr || 'Commande'}</p>
                  </div>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>Conteneur : {d.conteneur_id}</span>
                </div>

                {/* Timeline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  {TIMELINE_STEPS.map((step, i) => {
                    const active = i <= currentStep;
                    return (
                      <div key={step.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                        {i > 0 && (
                          <div style={{
                            position: 'absolute', top: 16, left: '-50%', right: '50%', height: 3,
                            background: i <= currentStep ? '#1565C0' : '#E5E7EB',
                          }} />
                        )}
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: active ? '#1565C0' : '#F3F4F6', fontSize: 14, position: 'relative', zIndex: 1,
                        }}>
                          {active ? <span style={{ filter: 'brightness(10)' }}>{step.icon}</span> : <span style={{ opacity: 0.4 }}>{step.icon}</span>}
                        </div>
                        <span style={{ fontSize: 10, color: active ? '#1565C0' : '#9CA3AF', fontWeight: active ? 600 : 400, marginTop: 6 }}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
