import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc, where } from 'firebase/firestore';
import { useLocation } from 'wouter';
import { db } from '../../lib/firebase';
import { Card, Kpi, Pill, Button, IconButton, EyeIcon } from '../components/Icons';

interface Partner {
  id: string;
  nom: string;
  code: string;
  email: string;
  tel: string;
  commission_taux: number;
  actif: boolean;
}

export default function Partenaires() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const [showAdd, setShowAdd] = useState(false);
  const [newP, setNewP] = useState({ nom: '', email: '', code: '', telephone: '', userId: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'partners'), orderBy('nom', 'asc'));
      const snap = await getDocs(q);
      setPartners(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Partner)));
    } catch (err) {
      console.error('Error loading partners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActif = async (p: Partner) => {
    try {
      await updateDoc(doc(db, 'partners', p.id), { actif: !p.actif });
      load();
      setSuccessMsg('Statut mis à jour');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error toggling:', err);
      setErrorMsg('Erreur lors de la mise à jour du statut');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleAddPartner = async () => {
    if (!newP.nom || !newP.code) return;
    try {
      // Validation format
      if (!/^[A-Z]{2,3}$/.test(newP.code)) {
        setErrorMsg('Le code doit contenir 2 ou 3 lettres en majuscules');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
      }

      // Vérifier unicité du code
      const existingQ = query(collection(db, 'partners'), where('code', '==', newP.code));
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        setErrorMsg(`Le code "${newP.code}" est déjà utilisé par un autre partenaire`);
        setTimeout(() => setErrorMsg(''), 3000);
        return;
      }

      await addDoc(collection(db, 'partners'), {
        nom: newP.nom,
        email: newP.email,
        code: newP.code,
        tel: newP.telephone,
        userId: newP.userId || null,
        commission_taux: 0,
        actif: true,
        createdAt: new Date(),
      });
      setShowAdd(false);
      setNewP({ nom: '', email: '', code: '', telephone: '', userId: '' });
      setSuccessMsg('Partenaire ajouté avec succès');
      setTimeout(() => setSuccessMsg(''), 3000);
      load();
    } catch (err) {
      console.error('Error adding partner:', err);
      setErrorMsg('Erreur lors de l\'ajout du partenaire');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const actifs = partners.filter(p => p.actif).length;

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;

  return (
    <>
      {successMsg && <div className="alert gr">{successMsg}</div>}
      {errorMsg && <div className="alert rd">{errorMsg}</div>}

      <div className="kgrid">
        <Kpi label="Total partenaires" value={partners.length} color="pu" />
        <Kpi label="Actifs" value={actifs} color="gr" />
        <Kpi label="Inactifs" value={partners.length - actifs} />
      </div>

      <div className="filters">
        <Button variant="p" onClick={() => setShowAdd(true)}>+ Ajouter partenaire</Button>
      </div>

      <Card title={`Partenaires (${partners.length})`} subtitle="Cliquer sur une ligne pour voir le détail">
        <table className="admin-table">
          <thead>
            <tr><th>Code</th><th>Nom</th><th>Email</th><th>Tél</th><th style={{textAlign:'right'}}>Commission</th><th>Actif</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {partners.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#666' }}>Aucun partenaire</td></tr>
            ) : partners.map((p) => (
              <tr key={p.id} className="cl" onClick={() => setLocation(`/admin/partenaires/${p.id}`)}>
                <td><Pill variant="pu">{p.code}</Pill></td>
                <td style={{ fontWeight: 700 }}>{p.nom}</td>
                <td>{p.email}</td>
                <td>{p.tel || '—'}</td>
                <td style={{ textAlign: 'right' }}>{p.commission_taux}%</td>
                <td>
                  <Button variant={p.actif ? 's' : 'o'} onClick={(e: any) => { e.stopPropagation(); toggleActif(p); }}
                    style={{ fontSize: 11, padding: '2px 8px' }}>
                    {p.actif ? '✓ Actif' : '✕ Inactif'}
                  </Button>
                </td>
                <td className="tda">
                  <IconButton icon={<EyeIcon />} tooltip="Détail" variant="eye" onClick={(e: any) => { e.stopPropagation(); setLocation(`/admin/partenaires/${p.id}`); }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 440, padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Nouveau partenaire</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="fi" placeholder="Nom complet" value={newP.nom} onChange={e => setNewP({...newP, nom: e.target.value})} />
              <input className="fi" placeholder="Email" type="email" value={newP.email} onChange={e => setNewP({...newP, email: e.target.value})} />
              <input className="fi" placeholder="Code (2-3 lettres)" value={newP.code} onChange={e => setNewP({...newP, code: e.target.value.toUpperCase().slice(0,3)})} maxLength={3} />
              <input className="fi" placeholder="Telephone (optionnel)" value={newP.telephone} onChange={e => setNewP({...newP, telephone: e.target.value})} />
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                  User ID Firebase (pour espace partenaire)
                </label>
                <input
                  className="fi"
                  placeholder="Ex: AbC123XyZ..."
                  value={newP.userId}
                  onChange={e => setNewP({...newP, userId: e.target.value})}
                />
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                  Optionnel. Se trouve dans Firebase Console → Authentication → UID
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowAdd(false)}>Annuler</button>
              <button className="btn p" onClick={handleAddPartner} disabled={!newP.nom || !newP.code}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
