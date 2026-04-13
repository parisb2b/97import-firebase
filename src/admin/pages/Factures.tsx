import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useLocation } from 'wouter';
import { db } from '../../lib/firebase';
import { Card, Pill, IconButton, Kpi, FileIcon, CardIcon, DollarIcon, DownloadIcon, EuroIcon, EyeIcon } from '../components/Icons';
import { generateDevis, generateFactureAcompte, generateFactureFinale, generateNoteCommission, downloadPDF } from '../../lib/pdf-generator';

interface Invoice {
  id: string;
  numero: string;
  type: string;
  quote_id: string;
  client_nom: string;
  partenaire_code?: string;
  montant: number;
  statut: string;
  createdAt: any;
}

export default function Factures() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [emetteurData, setEmetteurData] = useState<any>(null);
  const [, setLocation] = useLocation();

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
        const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice)));
      } catch (err) {
        console.error('Error loading invoices:', err);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };
    load();
    return () => clearTimeout(timeout);
  }, []);

  const handleDevisPDF = async (inv: Invoice) => {
    try {
      const snap = await getDoc(doc(db, 'quotes', inv.quote_id));
      if (!snap.exists()) { alert('Devis introuvable'); return; }
      const pdfDoc = generateDevis(snap.data(), emetteurData);
      downloadPDF(pdfDoc, `${inv.quote_id}.pdf`);
    } catch (err) {
      console.error('Erreur PDF devis:', err);
    }
  };

  const handleFacturePDF = async (inv: Invoice) => {
    try {
      const snap = await getDoc(doc(db, 'quotes', inv.quote_id));
      if (!snap.exists()) { alert('Devis associé introuvable'); return; }
      const quoteData = snap.data();
      const pdfDoc = inv.type === 'acompte'
        ? generateFactureAcompte(quoteData, { montant: inv.montant, numero: inv.numero, createdAt: inv.createdAt }, emetteurData)
        : generateFactureFinale(quoteData, inv.numero, emetteurData);
      downloadPDF(pdfDoc, `${inv.numero}.pdf`);
    } catch (err) {
      console.error('Erreur PDF facture:', err);
    }
  };

  const handleNCPDF = async (inv: Invoice) => {
    try {
      const commSnap = await getDocs(query(collection(db, 'commissions'), orderBy('createdAt', 'desc')));
      const note = commSnap.docs.find(d => d.data().quote_id === inv.quote_id);
      if (!note) { alert('Aucune note de commission liée'); return; }
      const pdfDoc = generateNoteCommission({ id: note.id, ...note.data() }, emetteurData);
      downloadPDF(pdfDoc, `NC-${inv.numero}.pdf`);
    } catch (err) {
      console.error('Erreur NC PDF:', err);
    }
  };

  const handleTogglePaid = async (inv: Invoice) => {
    const newStatut = inv.statut === 'payee' ? 'finalisee' : 'payee';
    try {
      await updateDoc(doc(db, 'invoices', inv.id), { statut: newStatut });
      setInvoices(invoices.map(i => i.id === inv.id ? { ...i, statut: newStatut } : i));
    } catch (err) {
      console.error('Erreur toggle statut:', err);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch = !search ||
      inv.numero.toLowerCase().includes(search.toLowerCase()) ||
      (inv.client_nom || '').toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || inv.type === filterType;
    const matchStatut = !filterStatut || inv.statut === filterStatut;
    return matchSearch && matchType && matchStatut;
  });

  const totalMontant = filtered.reduce((s, i) => s + (i.montant || 0), 0);
  const totalEncaisse = filtered.filter(i => i.statut === 'payee').reduce((s, i) => s + (i.montant || 0), 0);
  const totalReste = totalMontant - totalEncaisse;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  }

  return (
    <>
      <div className="kgrid">
        <Kpi label="Total factures" value={filtered.length} color="tl" />
        <Kpi label="Montant total" value={`${totalMontant.toLocaleString('fr-FR')}€`} color="tl" />
        <Kpi label="Encaissé" value={`${totalEncaisse.toLocaleString('fr-FR')}€`} color="gr" />
        <Kpi label="Reste à encaisser" value={`${totalReste.toLocaleString('fr-FR')}€`} color="or" />
      </div>

      <div className="filters">
        <input
          className="si-bar"
          placeholder="Rechercher N° facture, client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="fsel" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Tous types</option>
          <option value="acompte">Acompte</option>
          <option value="finale">Finale</option>
        </select>
        <select className="fsel" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="payee">Payée</option>
          <option value="finalisee">Finalisée</option>
        </select>
      </div>

      <Card title={`Factures (${filtered.length})`} subtitle="Cliquer sur les icônes pour les actions">
        <table className="admin-table">
          <thead>
            <tr>
              <th>N° Facture</th>
              <th>Type</th>
              <th>Devis lié</th>
              <th>Client</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Documents</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#666' }}>
                  Aucune facture
                </td>
              </tr>
            ) : filtered.map((inv) => (
              <tr key={inv.id} className="cl">
                <td style={{ fontWeight: 700 }}>{inv.numero}</td>
                <td>
                  <Pill variant={inv.type === 'acompte' ? 'tl' : 'bl'}>
                    {inv.type === 'acompte' ? 'Acompte' : 'Finale'}
                  </Pill>
                </td>
                <td style={{ color: 'var(--tx3)' }}>{inv.quote_id}</td>
                <td>{inv.client_nom || '—'}</td>
                <td style={{ fontWeight: 700, color: 'var(--tl)' }}>
                  {(inv.montant || 0).toLocaleString('fr-FR')}€
                </td>
                <td>
                  <Pill variant={inv.statut === 'payee' ? 'gr' : 'or'}>
                    {inv.statut === 'payee' ? 'Payée' : 'Finalisée'}
                  </Pill>
                </td>
                <td className="tda">
                  <IconButton icon={<EyeIcon />} tooltip="Voir détail" variant="eye" onClick={(e: any) => { e.stopPropagation(); setLocation('/admin/factures/' + inv.id); }} />
                  <IconButton icon={<FileIcon />} tooltip="Devis PDF" variant="eye" onClick={(e: any) => { e.stopPropagation(); handleDevisPDF(inv); }} />
                  <IconButton icon={<CardIcon />} tooltip="Facture PDF" variant="dl" onClick={(e: any) => { e.stopPropagation(); handleFacturePDF(inv); }} />
                  <IconButton icon={<DollarIcon />} tooltip="Note commission" variant="nc" onClick={(e: any) => { e.stopPropagation(); handleNCPDF(inv); }} />
                  <IconButton icon={<DownloadIcon />} tooltip="Télécharger" variant="dl" onClick={(e: any) => { e.stopPropagation(); handleFacturePDF(inv); }} />
                  <IconButton
                    icon={<EuroIcon />}
                    tooltip={inv.statut === 'payee' ? 'Marquer non payée' : 'Marquer payée'}
                    variant="eur"
                    paid={inv.statut === 'payee'}
                    onClick={(e: any) => { e.stopPropagation(); handleTogglePaid(inv); }}
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
