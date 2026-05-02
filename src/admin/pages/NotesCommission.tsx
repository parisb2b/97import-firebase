import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useLocation } from 'wouter';
import { db } from '../../lib/firebase';
import { Card, Pill, IconButton, Kpi, FileIcon, DownloadIcon, EuroIcon, SendIcon, DollarIcon, EyeIcon } from '../components/Icons';
import { generateDevis, generateNoteCommission, downloadPDF } from '../../lib/pdf-generator';
import ModalNouvelleCommission from '@/admin/components/commission/ModalNouvelleCommission';
import ModalMarquerPayee from '@/admin/components/commission/ModalMarquerPayee';
import LoadingState from '../components/atoms/LoadingState';

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
  const [, setLocation] = useLocation();
  const [showNouvelleModal, setShowNouvelleModal] = useState(false);
  const [commissionAPayer, setCommissionAPayer] = useState<any>(null);

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

  const loadCommissions = async () => {
    try {
      const q = query(collection(db, 'commissions'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setCommissions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Commission)));
    } catch (err) {
      console.error('Error loading commissions:', err);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);
    const load = async () => {
      await loadCommissions();
      clearTimeout(timeout);
      setLoading(false);
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

  const handleNCPDF = async (c: Commission) => {
    try {
      const devisDetails = [];

      for (const ligne of (c.lignes || [])) {
        const quoteId = ligne.quote_id;
        if (!quoteId) continue;

        const quoteSnap = await getDoc(doc(db, 'quotes', quoteId));

        if (quoteSnap.exists()) {
          const quoteData = quoteSnap.data();
          const produits = (quoteData.lignes || []).map((l: any) => ({
            ref: l.ref || '',
            nom_fr: l.nom_fr || '',
            prix_negocie: l.prix_unitaire || 0,
            prix_partenaire: l.prix_unitaire
              ? Math.round((l.prix_unitaire - (l.prix_unitaire * (ligne.commission || 0) / (ligne.montant_ht || 1))) * 100) / 100
              : 0,
          }));

          devisDetails.push({
            numero: quoteData.numero || quoteId,
            client: ligne.client || quoteData.client_nom || '',
            destination: quoteData.destination || '',
            lignes: produits,
          });
        } else {
          devisDetails.push({
            numero: quoteId,
            client: ligne.client || '',
            destination: '',
            lignes: [{
              ref: '',
              nom_fr: `Devis ${quoteId}`,
              prix_negocie: ligne.montant_ht || 0,
              prix_partenaire: (ligne.montant_ht || 0) - (ligne.commission || 0),
            }],
          });
        }
      }

      const noteEnrichie = { ...c, devis: devisDetails };
      const pdfDoc = generateNoteCommission(noteEnrichie, emetteurData);
      downloadPDF(pdfDoc, `${c.numero}.pdf`);
    } catch (err) {
      console.error('Erreur génération NC PDF:', err);
    }
  };

  const handleTogglePaid = async (c: Commission) => {
    if (c.statut === 'payee') {
      // Inverser : remettre en attente (simple toggle)
      if (confirm(`Remettre ${c.numero} en attente ?`)) {
        try {
          await updateDoc(doc(db, 'commissions', c.id), {
            statut: 'en_attente',
            paiement: null,
            updated_at: serverTimestamp(),
          });
          await loadCommissions();
        } catch (err) {
          console.error('Erreur toggle:', err);
        }
      }
    } else {
      // Passer en payé : ouvrir modal avec formulaire
      setCommissionAPayer(c);
    }
  };

  const handleSendNC = async (c: Commission) => {
    if (!c.partenaire_nom) {
      alert('⚠️ Ce partenaire n\'a pas d\'email enregistré. Ajoutez-le dans la fiche partenaire d\'abord.');
      return;
    }

    // Get partner email from partners collection
    let partnerEmail = '';
    try {
      const partnersSnap = await getDocs(collection(db, 'partners'));
      const partner = partnersSnap.docs.find(d => d.data().code === c.partenaire_code);
      if (partner?.data().email) {
        partnerEmail = partner.data().email;
      }
    } catch (err) {
      console.error('Error fetching partner email:', err);
    }

    if (!partnerEmail) {
      alert('⚠️ Ce partenaire n\'a pas d\'email enregistré. Ajoutez-le dans la fiche partenaire d\'abord.');
      return;
    }

    if (!confirm(
      `Envoyer la note de commission ${c.numero} à :\n` +
      `${c.partenaire_nom} <${partnerEmail}> ?\n\n` +
      `(Email simple avec lien vers l'espace partenaire. PDF en pièce jointe sera ajouté en Phase 3.)`
    )) return;

    try {
      // Utiliser le système mail Firestore (Trigger Email extension déjà configuré)
      await addDoc(collection(db, 'mail'), {
        to: partnerEmail,
        message: {
          subject: `Nouvelle note de commission ${c.numero}`,
          html: `
          <h2 style="color:#1565C0">Nouvelle commission disponible</h2>
          <p>Bonjour ${c.partenaire_nom},</p>
          <p>Une nouvelle note de commission est disponible dans votre espace partenaire :</p>
          <ul>
            <li><strong>Numéro :</strong> ${c.numero}</li>
            <li><strong>Montant :</strong> ${c.total_commission?.toFixed(2)} €</li>
            <li><strong>Nombre de devis :</strong> ${c.lignes?.length || 0}</li>
          </ul>
          <p>
            <a href="https://97import.com/mon-compte"
               style="background:#EA580C;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block">
              Voir dans mon espace partenaire
            </a>
          </p>
          <p style="color:#6B7280;font-size:12px">
            Cet email est envoyé automatiquement par 97import.com
          </p>
        `,
        },
      });

      // Mettre à jour date envoi
      await updateDoc(doc(db, 'commissions', c.id), {
        date_envoi: serverTimestamp(),
      });

      alert('✅ Email envoyé au partenaire');
      await loadCommissions();
    } catch (err: any) {
      alert('❌ Erreur envoi : ' + err.message);
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
    return <LoadingState message="Chargement des notes de commission…" />;
  }

  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1565C0' }}>
            Notes de Commission
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6B7280' }}>
            Gestion des commissions partenaires
          </p>
        </div>
        <button
          onClick={() => setShowNouvelleModal(true)}
          style={{
            padding: '10px 20px', background: '#EA580C',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          + Nouvelle NC
        </button>
      </div>

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
                  {c.statut === 'payee' ? (
                    <div>
                      <Pill variant="gr">Payée</Pill>
                      {(c as any).paiement?.date && (
                        <div style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>
                          {new Date((c as any).paiement.date).toLocaleDateString('fr-FR')} · {(c as any).paiement.methode}
                          {(c as any).paiement.reference && ` (${(c as any).paiement.reference})`}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Pill variant={c.statut === 'en_attente' ? 'or' : 'gy'}>
                      {c.statut === 'en_attente' ? 'En attente' : c.statut || 'Brouillon'}
                    </Pill>
                  )}
                </td>
                <td className="tda">
                  <IconButton icon={<EyeIcon />} tooltip="Voir détail" variant="eye" onClick={(e: any) => { e.stopPropagation(); setLocation('/admin/commissions/' + c.id); }} />
                  <IconButton icon={<FileIcon />} tooltip="Devis PDF" variant="eye" onClick={(e: any) => { e.stopPropagation(); handleDevisPDF(c); }} />
                  <IconButton icon={<DollarIcon />} tooltip="NC PDF" variant="nc" onClick={() => handleNCPDF(c)} />
                  <IconButton icon={<DownloadIcon />} tooltip="Télécharger" variant="dl" onClick={() => handleNCPDF(c)} />
                  <IconButton icon={<SendIcon />} tooltip="Envoyer" variant="send" onClick={() => handleSendNC(c)} />
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

      {showNouvelleModal && (
        <ModalNouvelleCommission
          onClose={() => setShowNouvelleModal(false)}
          onSuccess={() => {
            setShowNouvelleModal(false);
            loadCommissions();
          }}
        />
      )}

      {commissionAPayer && (
        <ModalMarquerPayee
          commission={commissionAPayer}
          onClose={() => setCommissionAPayer(null)}
          onSuccess={() => {
            setCommissionAPayer(null);
            loadCommissions();
          }}
        />
      )}
    </>
  );
}
