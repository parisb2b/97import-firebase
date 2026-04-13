import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { Card, Button, InfoBlock } from '../components/Icons';
import { generateBCChine, generateBEExport, generateBDPackingList, generateBDInvoiceExcel, downloadExcel } from '../../lib/excel-generator';

interface LigneConteneur {
  ref: string;
  nom_fr: string;
  nom_zh: string;
  qte_colis: number;
  qte_pieces: number;
  l: number;
  L: number;
  h: number;
  volume_m3: number;
  poids_net: number;
}

interface Container {
  id: string;
  numero: string;
  type: string;
  destination: string;
  statut: string;
  date_depart?: any;
  date_arrivee_prevue?: any;
  voyage_number?: string;
  bl_waybill?: string;
  seal?: string;
  port_chargement: string;
  port_destination: string;
  lignes: LigneConteneur[];
  volume_total: number;
  poids_total: number;
}

export default function DetailConteneur() {
  const { t } = useI18n();
  const [, params] = useRoute('/admin/conteneurs/:id');
  const [container, setContainer] = useState<Container | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      const snap = await getDoc(doc(db, 'containers', params.id));
      if (snap.exists()) setContainer({ id: snap.id, ...snap.data() } as Container);
      setLoading(false);
    };
    load();
  }, [params?.id]);

  const calculateTotals = (lignes: LigneConteneur[]) => ({
    volume_total: lignes.reduce((sum, l) => sum + l.volume_m3, 0),
    poids_total: lignes.reduce((sum, l) => sum + l.poids_net * l.qte_pieces, 0),
  });

  const handleSave = async () => {
    if (!container) return;
    setSaving(true);
    try {
      const totals = calculateTotals(container.lignes);
      await updateDoc(doc(db, 'containers', container.id), { ...container, ...totals, updatedAt: serverTimestamp() });
      setContainer({ ...container, ...totals });
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLigne = () => {
    if (!container) return;
    setContainer({ ...container, lignes: [...container.lignes, { ref: '', nom_fr: '', nom_zh: '', qte_colis: 1, qte_pieces: 1, l: 0, L: 0, h: 0, volume_m3: 0, poids_net: 0 }] });
  };

  const handleLigneChange = (index: number, field: keyof LigneConteneur, value: string | number) => {
    if (!container) return;
    const newLignes = [...container.lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    if (['l', 'L', 'h'].includes(field)) {
      const { l, L, h } = newLignes[index];
      newLignes[index].volume_m3 = (l * L * h) / 1000000;
    }
    setContainer({ ...container, lignes: newLignes });
  };

  const handleRemoveLigne = (index: number) => {
    if (!container) return;
    setContainer({ ...container, lignes: container.lignes.filter((_, i) => i !== index) });
  };

  const handleStatutChange = async (newStatut: string) => {
    if (!container) return;
    try {
      await updateDoc(doc(db, 'containers', container.id), { statut: newStatut, updatedAt: serverTimestamp() });
      setContainer({ ...container, statut: newStatut });
    } catch (err) {
      console.error('Error updating statut:', err);
    }
  };

  const handleExportExcel = (type: string) => {
    if (!container) return;
    const data = { ...container } as any;
    switch (type) {
      case 'bc': downloadExcel(generateBCChine(data), `BC-${container.numero}.xlsx`); break;
      case 'be': downloadExcel(generateBEExport(data), `BE-${container.numero}.xlsx`); break;
      case 'packing': downloadExcel(generateBDPackingList(data), `PL-${container.numero}.xlsx`); break;
      case 'invoice': downloadExcel(generateBDInvoiceExcel(data), `INV-${container.numero}.xlsx`); break;
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  if (!container) return <div className="alert rd">Conteneur non trouvé</div>;

  const totals = calculateTotals(container.lignes);

  return (
    <>
      {/* Header */}
      <div className="filters" style={{ justifyContent: 'space-between' }}>
        <div className="ct" style={{ fontSize: 18 }}>{container.numero}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="p" onClick={handleSave} disabled={saving}>
            {saving ? t('loading') : t('btn.enregistrer')}
          </Button>
        </div>
      </div>

      {/* Infos conteneur */}
      <Card title="Informations conteneur">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: 16 }}>
          <InfoBlock title="Type"><span style={{ fontWeight: 600 }}>{container.type}</span></InfoBlock>
          <InfoBlock title="Destination"><span style={{ fontWeight: 600 }}>{container.destination}</span></InfoBlock>
          <InfoBlock title="Port chargement"><span>{container.port_chargement}</span></InfoBlock>
          <InfoBlock title="Port destination"><span>{container.port_destination}</span></InfoBlock>
          <div className="fg">
            <div className="fl">Statut</div>
            <select className="fsel" value={container.statut} onChange={(e) => handleStatutChange(e.target.value)}>
              <option value="préparation">En préparation</option>
              <option value="chargé">Chargé</option>
              <option value="parti">Parti du port</option>
              <option value="arrivé">Arrivé</option>
              <option value="livré">Livré</option>
            </select>
          </div>
          <InfoBlock title="Volume total"><span style={{ fontWeight: 600 }}>{totals.volume_total.toFixed(2)} m³</span></InfoBlock>
          <InfoBlock title="Poids total"><span style={{ fontWeight: 600 }}>{totals.poids_total.toLocaleString('fr-FR')} kg</span></InfoBlock>
        </div>
      </Card>

      {/* Documents export */}
      <Card title="Documents export">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 16 }}>
          <Button variant="t" onClick={() => handleExportExcel('bc')}>BC CHINE</Button>
          <Button variant="t" onClick={() => handleExportExcel('be')}>BE EXPORT</Button>
          <Button variant="s" onClick={() => handleExportExcel('invoice')}>BD INVOICE</Button>
          <Button variant="s" onClick={() => handleExportExcel('packing')}>BD PACKING LIST</Button>
          <Button variant="o" onClick={() => alert('Fonction email client en cours de développement')}>Email client</Button>
          <Button variant="o" onClick={() => alert('Fonction email transitaire en cours de développement')}>Email transitaire</Button>
          <Button variant="o" onClick={() => alert('Fonction tracking en cours de développement')}>Tracking</Button>
        </div>
      </Card>

      {/* Lignes conteneur */}
      <Card title="Contenu du conteneur" actions={
        <Button variant="o" onClick={handleAddLigne} style={{ fontSize: 12 }}>+ Ajouter une ligne</Button>
      }>
        {container.lignes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--tx3)' }}>Aucun produit</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Réf</th>
                  <th>Nom FR</th>
                  <th>Nom ZH</th>
                  <th style={{ textAlign: 'right', width: 60 }}>Colis</th>
                  <th style={{ textAlign: 'right', width: 60 }}>Pièces</th>
                  <th style={{ textAlign: 'right', width: 60 }}>L cm</th>
                  <th style={{ textAlign: 'right', width: 60 }}>l cm</th>
                  <th style={{ textAlign: 'right', width: 60 }}>H cm</th>
                  <th style={{ textAlign: 'right', width: 75 }}>Vol m³</th>
                  <th style={{ textAlign: 'right', width: 75 }}>Poids kg</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {container.lignes.map((ligne, index) => (
                  <tr key={index}>
                    <td><input className="fi" type="text" value={ligne.ref} onChange={(e) => handleLigneChange(index, 'ref', e.target.value)} /></td>
                    <td><input className="fi" type="text" value={ligne.nom_fr} onChange={(e) => handleLigneChange(index, 'nom_fr', e.target.value)} /></td>
                    <td><input className="fi" type="text" value={ligne.nom_zh} onChange={(e) => handleLigneChange(index, 'nom_zh', e.target.value)} /></td>
                    <td><input className="fi" type="number" value={ligne.qte_colis} min={1} style={{ textAlign: 'right' }} onChange={(e) => handleLigneChange(index, 'qte_colis', Number(e.target.value))} /></td>
                    <td><input className="fi" type="number" value={ligne.qte_pieces} min={1} style={{ textAlign: 'right' }} onChange={(e) => handleLigneChange(index, 'qte_pieces', Number(e.target.value))} /></td>
                    <td><input className="fi" type="number" value={ligne.l} min={0} style={{ textAlign: 'right' }} onChange={(e) => handleLigneChange(index, 'l', Number(e.target.value))} /></td>
                    <td><input className="fi" type="number" value={ligne.L} min={0} style={{ textAlign: 'right' }} onChange={(e) => handleLigneChange(index, 'L', Number(e.target.value))} /></td>
                    <td><input className="fi" type="number" value={ligne.h} min={0} style={{ textAlign: 'right' }} onChange={(e) => handleLigneChange(index, 'h', Number(e.target.value))} /></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{ligne.volume_m3.toFixed(3)}</td>
                    <td><input className="fi" type="number" value={ligne.poids_net} min={0} style={{ textAlign: 'right' }} onChange={(e) => handleLigneChange(index, 'poids_net', Number(e.target.value))} /></td>
                    <td>
                      <button onClick={() => handleRemoveLigne(index)} style={{ color: 'var(--rd)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
