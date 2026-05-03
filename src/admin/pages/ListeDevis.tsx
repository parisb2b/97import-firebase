import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { Link } from 'wouter';
import { adminDb as db } from '../../lib/firebase';
import { generateDevis, downloadPDF } from '../../lib/pdf-generator';
import PopupEncaisserAcompte from '../components/PopupEncaisserAcompte';
import {
  Card,
  Button,
  Pill,
  IconButton,
  EyeIcon,
  DownloadIcon,
  StarIcon,
  EuroIcon,
} from '../components/Icons';
import LoadingState from '../components/atoms/LoadingState';

interface Devis {
  id: string;
  numero: string;
  date: string;
  date_complete: string;
  client_nom: string;
  partenaire_code?: string;
  destination: string;
  produits: string;
  total_ht: number;
  statut: string;
  is_vip: boolean;
  conteneur_ref?: string;
  createdAt: any;
  acomptes: any[];
  nbAcomptesEncaisses: number;
  nbAcomptesDeclares: number;
  totalEncaisse: number;
}

export default function ListeDevis() {
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterDest, setFilterDest] = useState('');
  const [filterPartner, setFilterPartner] = useState('');
  const [devisPourEncaisser, setDevisPourEncaisser] = useState<any>(null);

  const handleDownloadDevisPDF = async (devisId: string, isVip = false) => {
    try {
      const snap = await getDoc(doc(db, 'quotes', devisId));
      if (!snap.exists()) { alert('Devis introuvable'); return; }
      const data = snap.data();
      const emSnap = await getDoc(doc(db, 'admin_params', 'emetteur'));
      const emetteur = emSnap.exists() ? emSnap.data() : undefined;
      const pdfDoc = generateDevis(data, emetteur);
      const filename = isVip
        ? `${data.numero || devisId}-VIP.pdf`
        : `${data.numero || devisId}.pdf`;
      downloadPDF(pdfDoc, filename);
    } catch (err) {
      console.error('Erreur PDF:', err);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const loadDevis = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => {
        const raw = d.data();
        const acomptes = raw.acomptes || [];
        const acomptesEncaisses = acomptes.filter((a: any) => a.encaisse === true);
        const acomptesDeclares = acomptes.filter((a: any) => a.encaisse === false);
        const dateComplete = raw.createdAt?.toDate
          ? raw.createdAt.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : (raw.date_creation ? new Date(raw.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—');
        return {
          id: d.id,
          numero: raw.numero || d.id,
          date: dateComplete,
          date_complete: dateComplete,
          client_nom: raw.client_nom || '',
          partenaire_code: raw.partenaire_code,
          destination: raw.destination || 'MQ',
          produits: raw.lignes?.map((l: any) => l.reference).join(', ') || '',
          total_ht: raw.total_ht || 0,
          statut: raw.statut || 'brouillon',
          is_vip: raw.is_vip || false,
          conteneur_ref: raw.conteneur_ref,
          acomptes,
          nbAcomptesEncaisses: acomptesEncaisses.length,
          nbAcomptesDeclares: acomptesDeclares.length,
          totalEncaisse: acomptesEncaisses.reduce((s: number, a: any) => s + (a.montant || 0), 0),
          lignes: raw.lignes || [],
          client_id: raw.client_id,
        } as any;
      });
      setDevis(data);
    } catch (err) {
      console.error('Error loading devis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevis();
  }, []);

  const handleExportCSV = () => {
    if (devis.length === 0) return;
    const BOM = '\uFEFF';
    const headers = ['Numéro', 'Client', 'Statut', 'Total HT', 'Partenaire', 'Date'];
    const rows = devis.map(d => [
      d.numero, d.client_nom, d.statut, d.total_ht,
      d.partenaire_code || 'Direct',
      d.date || '',
    ]);
    const csv = BOM + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devis-97import-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Utiliser directement les vraies données (plus de demo data)
  const displayDevis = devis;
  const filtered = displayDevis.filter((d) => {
    const matchSearch =
      !search ||
      d.numero.toLowerCase().includes(search.toLowerCase()) ||
      d.client_nom.toLowerCase().includes(search.toLowerCase()) ||
      d.produits.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || d.statut === filterStatut || (filterStatut === 'vip' && d.is_vip);
    const matchDest = !filterDest || d.destination === filterDest;
    const matchPartner = !filterPartner || d.partenaire_code === filterPartner;
    return matchSearch && matchStatut && matchDest && matchPartner;
  });

  const getStatutPill = (d: Devis) => {
    if (d.is_vip) return <Pill variant="pu">VIP</Pill>;
    switch (d.statut) {
      case 'en_attente':
      case 'brouillon':
        return <Pill variant="or">En attente</Pill>;
      case 'acompte_1':
        return <Pill variant="tl">Acompte 1</Pill>;
      case 'acompte_2':
        return <Pill variant="tl">Acompte 2</Pill>;
      case 'finalise':
        return <Pill variant="gr">Finalise</Pill>;
      default:
        return <Pill variant="gy">{d.statut}</Pill>;
    }
  };

  if (loading) {
    return <LoadingState message="Chargement des devis…" />;
  }

  return (
    <>
      {/* Filters */}
      <div className="filters">
        <input
          className="si-bar"
          placeholder="Rechercher N° devis, client, produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="fsel"
          style={{ padding: '7px 9px' }}
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
        >
          <option value="">Tous statuts</option>
          <option value="vip">VIP</option>
          <option value="en_attente">En attente</option>
          <option value="acompte_1">Acompte recu</option>
        </select>
        <select
          className="fsel"
          style={{ padding: '7px 9px' }}
          value={filterDest}
          onChange={(e) => setFilterDest(e.target.value)}
        >
          <option value="">Toutes dest.</option>
          <option value="MQ">MQ</option>
          <option value="GP">GP</option>
          <option value="RE">RE</option>
          <option value="GF">GF</option>
        </select>
        <select
          className="fsel"
          style={{ padding: '7px 9px' }}
          value={filterPartner}
          onChange={(e) => setFilterPartner(e.target.value)}
        >
          <option value="">Tous partenaires</option>
          <option value="JM">JM</option>
          <option value="TD">TD</option>
          <option value="MC">MC</option>
        </select>
        <Button variant="o" onClick={handleExportCSV}>📊 Export Excel</Button>
        <Link href="/admin/devis/nouveau">
          <Button variant="p">➕ Nouveau devis</Button>
        </Link>
      </div>

      {/* Card */}
      <Card
        title={`Tous les devis (${filtered.length})`}
        subtitle="Cliquer sur une ligne pour ouvrir"
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Date</th>
              <th>Client</th>
              <th>Part.</th>
              <th>Dest.</th>
              <th>Produits</th>
              <th>Montant</th>
              <th>Acomptes</th>
              <th>Statut</th>
              <th>Ctn.</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                  Aucun devis trouvé
                </td>
              </tr>
            ) : filtered.map((d) => (
              <tr key={d.id} className="cl">
                <td>
                  <Link href={`/admin/devis/${d.id}`}>
                    <strong style={{ cursor: 'pointer' }}>{d.numero}</strong>
                  </Link>
                </td>
                <td>{d.date}</td>
                <td>{d.client_nom}</td>
                <td>
                  {d.partenaire_code ? (
                    <Pill variant="pu">{d.partenaire_code}</Pill>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{d.destination}</td>
                <td>{d.produits}</td>
                <td
                  style={{
                    fontWeight: 700,
                    color: d.is_vip ? 'var(--pu)' : 'inherit',
                  }}
                >
                  {d.total_ht.toLocaleString('fr-FR')}€
                </td>
                <td style={{ textAlign: 'center' }}>
                  {d.acomptes.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: d.totalEncaisse > 0 ? '#166534' : '#D97706' }}>
                        {d.nbAcomptesEncaisses}/{d.acomptes.length}
                      </span>
                      {d.totalEncaisse > 0 && (
                        <span style={{ fontSize: 10, color: '#6B7280' }}>
                          {d.totalEncaisse.toLocaleString('fr-FR')}€
                        </span>
                      )}
                      {d.nbAcomptesDeclares > 0 && (
                        <span style={{ fontSize: 9, color: '#D97706', background: '#FFFBEB', padding: '1px 5px', borderRadius: 6 }}>
                          {d.nbAcomptesDeclares} en attente
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>—</span>
                  )}
                </td>
                <td>{getStatutPill(d)}</td>
                <td>
                  {d.conteneur_ref ? (
                    <Pill variant="nv" small>
                      {d.conteneur_ref}
                    </Pill>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="tda">
                  <Link href={`/admin/devis/${d.id}`}>
                    <IconButton icon={<EyeIcon />} tooltip="Voir detail" variant="eye" />
                  </Link>
                  <IconButton
                    icon={<DownloadIcon />}
                    tooltip="Devis PDF"
                    variant="dl"
                    onClick={(e: any) => { e?.stopPropagation(); handleDownloadDevisPDF(d.id); }}
                  />
                  {d.is_vip && (
                    <IconButton
                      icon={<StarIcon />}
                      tooltip="Devis VIP PDF"
                      variant="vip"
                      onClick={(e: any) => { e?.stopPropagation(); handleDownloadDevisPDF(d.id, true); }}
                    />
                  )}
                  <IconButton
                    icon={<EuroIcon />}
                    tooltip="Encaisser acompte"
                    variant="eur"
                    onClick={(e: any) => { e?.stopPropagation(); setDevisPourEncaisser(d); }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {devisPourEncaisser && (
        <PopupEncaisserAcompte
          devis={devisPourEncaisser}
          onClose={() => setDevisPourEncaisser(null)}
          onSuccess={() => {
            setDevisPourEncaisser(null);
            loadDevis();
          }}
        />
      )}
    </>
  );
}
