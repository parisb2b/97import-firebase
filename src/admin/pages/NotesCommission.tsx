import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, Pill, IconButton, Kpi, FileIcon, DownloadIcon, EuroIcon, SendIcon, DollarIcon } from '../components/Icons';
import { generateDevis, generateNoteCommission, downloadPDF } from '../../lib/pdf-generator';

interface Commission {
  id: string;
  numero: string;
  partenaire_id: string;
  partenaire_nom: string;
  partenaire_code?: string;
  client_nom?: string;
  quote_id?: string;
  total_commission: number;
  statut: string;
  lignes?: any[];
  createdAt: any;
}

export default function NotesCommission() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPartner, setFilterPartner] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [emetteurData, setEmetteurData] = useState<any>(null);

  useEffect(() => {
    const fetchEmetteur = async () => {
      try {
        const snap = await getDoc(doc(db, 'admin_params', 'emetteur'));
        if (snap.exists()) setEmetteurData(snap.data());
      } catch (e) {
        console.error('Erreur chargement émetteur:', e);
      }
    };
    fetchEmetteur();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);
    const load = async () => {
      try {
        const q = query(collection(db, 'commissions'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setCommissions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Commission)));
      } catch (err) {
        console.error('Error loading commissions:', err);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };
    load();
    return () => clearTimeout(timeout);
  }, []);

  const handleDevisPDF = async (c: Commission) => {
    if (!c.quote_id) { alert('Pas de devis lié'); return; }
    try {
      const snap = await getDoc(doc(db, 'quotes', c.quote_id));
      if (!snap.exists()) { alert('Devis introuvable'); return; }
      const pdfDoc = generateDevis(snap.data(), emetteurData);
      downloadPDF(pdfDoc, `${c.quote_id}.pdf`);
    } catch (err) {
      console.error('Erreur PDF devis:', err);
    }
  };

  const handleNCPDF = (c: Commission) => {
    const pdfDoc = generateNoteCommission(c, emetteurData);
    downloadPDF(pdfDoc, `${c.numero}.pdf`);
  };

  const handleTogglePaid = async (c: Commission) => {
    const newStatut = c.statut === 'payee' ? 'en_attente' : 'payee';
    try {
      await updateDoc(doc(db, 'commissions', c.id), { statut: newStatut });
      setCommissions(commissions.map(x => x.id === c.id ? { ...x, statut: newStatut } : x));
    } catch (err) {
      console.error('Erreur toggle:', err);
    }
  };

  const filtered = commissions.filter((c) => {
    const matchSearch = !search ||
      c.numero.toLowerCase().includes(search.toLowerCase()) ||
      c.partenaire_nom.toLowerCase().includes(search.toLowerCase()) ||
      (c.client_nom || '').toLowerCase().includes(search.toLowerCase());
    const matchPartner = !filterPartner || c.partenaire_code === filterPartner;
    const matchStatut = !filterStatut || c.statut === filterStatut;
    return matchSearch && matchPartner && matchStatut;
  });

  const partners = [...new Set(commissions.map(c => c.partenaire_code).filter(Boolean))];
  const totalDues = filtered.filter(c => c.statut !== 'payee').reduce((s, c) => s + (c.total_commission || 0), 0);
  const totalPayees = filtered.filter(c => c.statut === 'payee').reduce((s, c) => s + (c.total_commission || 0), 0);
  const aEnvoyer = filtered.filter(c => c.statut === 'brouillon' || !c.statut).length;
  const now = new Date();
  const ceMois = filtered.filter(c => {
    if (!c.createdAt?.toDate) return false;
    const d = c.createdAt.toDate();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  }

  return (
    <>
      <div className="kgrid">
        <Kpi label="Total dues" value={`${totalDues.toLocaleString('fr-FR')}€`} color="or" />
        <Kpi label="Total payées" value={`${totalPayees.toLocaleString('fr-FR')}€`} color="gr" />
        <Kpi label="À envoyer" value={aEnvoyer} color="rd" />
        <Kpi label="Ce mois" value={ceMois} />
      </div>

      <div className="filters">
        <input
          className="si-bar"
          placeholder="Rechercher N° NC, partenaire, client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="fsel" value={filterPartner} onChange={(e) => setFilterPartner(e.target.value)}>
          <option value="">Tous partenaires</option>
          {partners.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="fsel" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="payee">Payée</option>
          <option value="en_attente">En attente</option>
          <option value="brouillon">Brouillon</option>
        </select>
      </div>

      <Card title={`Notes de commission (${filtered.length})`} subtitle="Thème violet — commissions partenaires">
        <table className="admin-table">
          <thead>
            <tr>
              <th>N° NC</th>
              <th>Date</th>
              <th>Partenaire</th>
              <th>Client</th>
              <th>Devis</th>
              <th>Commission</th>
              <th>Statut</th>
              <th>Documents</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#666' }}>
                  Aucune note de commission
                </td>
              </tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="cl">
                <td style={{ fontWeight: 700 }}>{c.numero}</td>
                <td style={{ color: 'var(--tx3)' }}>
                  {c.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'}
                </td>
                <td>
                  <Pill variant="pu">{c.partenaire_code || c.partenaire_nom}</Pill>
                </td>
                <td>{c.client_nom || '—'}</td>
                <td style={{ color: 'var(--tx3)' }}>{c.quote_id || '—'}</td>
                <td style={{ fontWeight: 700, color: 'var(--pu)' }}>
                  {(c.total_commission || 0).toLocaleString('fr-FR')}€
                </td>
                <td>
                  <Pill variant={c.statut === 'payee' ? 'gr' : c.statut === 'en_attente' ? 'or' : 'gy'}>
                    {c.statut === 'payee' ? 'Payée' : c.statut === 'en_attente' ? 'En attente' : c.statut || 'Brouillon'}
                  </Pill>
                </td>
                <td className="tda">
                  <IconButton icon={<FileIcon />} tooltip="Devis PDF" variant="eye" onClick={() => handleDevisPDF(c)} />
                  <IconButton icon={<DollarIcon />} tooltip="NC PDF" variant="nc" onClick={() => handleNCPDF(c)} />
                  <IconButton icon={<DownloadIcon />} tooltip="Télécharger" variant="dl" onClick={() => handleNCPDF(c)} />
                  <IconButton icon={<SendIcon />} tooltip="Envoyer" variant="send" onClick={() => alert(`Envoi NC ${c.numero} à ${c.partenaire_nom}`)} />
                  <IconButton
                    icon={<EuroIcon />}
                    tooltip={c.statut === 'payee' ? 'Marquer non payée' : 'Marquer payée'}
                    variant="eur"
                    paid={c.statut === 'payee'}
                    onClick={() => handleTogglePaid(c)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
