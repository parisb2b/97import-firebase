// src/admin/pages/AcomptesEncaisser.tsx
// Page admin listant tous les devis avec leurs états de paiement

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  QuoteStatus,
  libelleStatut, couleurStatut,
  getTotalPaye, getRestantAPayer, getNbAcomptes,
  Acompte,
} from '../../lib/quoteStatusHelpers';

export default function AcomptesEncaisser() {
  const [, navigate] = useLocation();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [filtreStatut, setFiltreStatut] = useState<'tous' | QuoteStatus>('tous');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Écouter les devis non entièrement payés
    const q = query(
      collection(db, 'quotes'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      // Filtrer : exclure les devis annulés
      const relevant = all.filter(q => q.statut !== 'annule');
      setQuotes(relevant);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const quotesFiltered = quotes.filter(q => {
    if (filtreStatut === 'tous') return true;
    return q.statut === filtreStatut;
  });

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E3A5F', margin: 0 }}>
          💰 Acomptes à encaisser
        </h1>
        <div style={{ fontSize: 14, color: '#6B7280' }}>
          {quotesFiltered.length} devis affichés
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['tous', 'nouveau', 'acompte_1', 'acompte_2', 'acompte_3', 'solde_paye', 'en_production'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFiltreStatut(s)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
              background: filtreStatut === s ? '#1E3A5F' : '#E5E7EB',
              color: filtreStatut === s ? '#fff' : '#374151',
            }}
          >
            {s === 'tous' ? 'Tous' : libelleStatut(s as QuoteStatus)}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#F9FAFB' }}>
            <tr>
              <th style={thStyle}>N° Devis</th>
              <th style={thStyle}>Client</th>
              <th style={thStyle}>Total HT</th>
              <th style={thStyle}>Payé</th>
              <th style={thStyle}>Reste</th>
              <th style={thStyle}>Acomptes</th>
              <th style={thStyle}>Statut</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {quotesFiltered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>
                  Aucun devis à afficher
                </td>
              </tr>
            ) : (
              quotesFiltered.map(q => {
                const acomptes = (q.acomptes || []) as Acompte[];
                const paye = getTotalPaye(acomptes);
                const restant = getRestantAPayer(q.total_ht || 0, acomptes);
                const nbPartiels = getNbAcomptes(acomptes);
                const statut = (q.statut || 'nouveau') as QuoteStatus;

                return (
                  <tr key={q.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={tdStyle}>
                      <code style={{ fontSize: 12 }}>{q.numero || q.id}</code>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{q.client_nom || '—'}</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>{q.client_email || ''}</div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      {formatEuros(q.total_ht || 0)}
                    </td>
                    <td style={{ ...tdStyle, color: '#10B981', fontWeight: 600 }}>
                      {formatEuros(paye)}
                    </td>
                    <td style={{ ...tdStyle, color: restant > 0.01 ? '#D97706' : '#10B981', fontWeight: 600 }}>
                      {formatEuros(restant)}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12 }}>{nbPartiels}/3</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 12,
                        fontSize: 11, fontWeight: 600,
                        background: couleurStatut(statut) + '22',
                        color: couleurStatut(statut),
                      }}>
                        {libelleStatut(statut)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => navigate(`/admin/devis/${q.id}`)}
                        style={{
                          padding: '6px 12px',
                          background: '#1E3A5F',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        Ouvrir →
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 13,
  color: '#0F172A',
};

function formatEuros(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}
