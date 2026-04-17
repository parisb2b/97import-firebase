import { useState, useEffect } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import DropdownPorts from '../components/DropdownPorts';

const STATUTS = [
  { value: 'preparation', label: 'En préparation', color: '#1565C0' },
  { value: 'en_chargement', label: 'En chargement', color: '#D97706' },
  { value: 'en_mer', label: 'En mer', color: '#2563EB' },
  { value: 'arrive', label: 'Arrivé au port', color: '#059669' },
  { value: 'livre', label: 'Livré', color: '#065F46' },
];

const DESTINATIONS = [
  { code: 'MQ', label: '🇲🇶 Martinique' },
  { code: 'GP', label: '🇬🇵 Guadeloupe' },
  { code: 'GF', label: '🇬🇫 Guyane' },
  { code: 'RE', label: '🇷🇪 Réunion' },
  { code: 'FR', label: '🇫🇷 France Métro.' },
];

export default function DetailConteneur() {
  const [, params] = useRoute('/admin/conteneurs/:id');
  const [, setLocation] = useLocation();
  const [conteneur, setConteneur] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (params?.id) loadConteneur(params.id);
  }, [params?.id]);

  const loadConteneur = async (id: string) => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'conteneurs', id));
      if (snap.exists()) {
        const data = snap.data();
        setConteneur({ id: snap.id, ...data });
        setForm({
          type: data.type || '',
          destination: data.destination || '',
          date_depart_est: timestampToDateInput(data.date_depart_est),
          date_arrivee_est: timestampToDateInput(data.date_arrivee_est),
          port_chargement: data.port_chargement || '',
          port_destination: data.port_destination || '',
          num_physique: data.num_physique || '',
          voyage_number: data.voyage_number || '',
          bl_number: data.bl_number || '',
          seal_number: data.seal_number || '',
          statut: data.statut || 'preparation',
          notes: data.notes || '',
        });
      } else {
        alert('Conteneur introuvable');
        setLocation('/admin/conteneurs');
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!conteneur) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'conteneurs', conteneur.id), {
        type: form.type,
        destination: form.destination,
        date_depart_est: form.date_depart_est ? Timestamp.fromDate(new Date(form.date_depart_est)) : null,
        date_arrivee_est: form.date_arrivee_est ? Timestamp.fromDate(new Date(form.date_arrivee_est)) : null,
        port_chargement: form.port_chargement,
        port_destination: form.port_destination,
        num_physique: form.num_physique,
        voyage_number: form.voyage_number,
        bl_number: form.bl_number,
        seal_number: form.seal_number,
        statut: form.statut,
        notes: form.notes,
        updated_at: serverTimestamp(),
      });

      alert('Conteneur mis à jour');
      await loadConteneur(conteneur.id);
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!conteneur) return;
    if (Array.isArray(conteneur.devis_lies) && conteneur.devis_lies.length > 0) {
      alert(`Impossible de supprimer : ${conteneur.devis_lies.length} devis sont liés à ce conteneur.`);
      return;
    }
    if (!confirm(`Supprimer définitivement le conteneur ${conteneur.numero} ?`)) return;

    try {
      await deleteDoc(doc(db, 'conteneurs', conteneur.id));
      alert('Conteneur supprimé');
      setLocation('/admin/conteneurs');
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    }
  };

  if (loading || !conteneur) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Chargement...</div>;
  }

  const statutInfo = STATUTS.find(s => s.value === form.statut) || STATUTS[0];
  const destLabel = DESTINATIONS.find(d => d.code === form.destination)?.label || form.destination;
  const nbDevis = Array.isArray(conteneur.devis_lies) ? conteneur.devis_lies.length : 0;

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Link href="/admin/conteneurs">
          <button style={{ background: 'transparent', border: 'none', color: '#6B7280', fontSize: 14, cursor: 'pointer', padding: 0 }}>
            ← Retour liste
          </button>
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1E3A5F', margin: 0 }}>
            {conteneur.numero}
          </h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <span style={{
              background: `${statutInfo.color}15`, color: statutInfo.color,
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            }}>
              {statutInfo.label}
            </span>
            <span style={{ color: '#6B7280', fontSize: 14 }}>
              {form.type} · {destLabel} · {nbDevis} devis liés
            </span>
          </div>
        </div>
      </div>

      {/* Section Informations principales */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Informations principales</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
              <option value="20GP">20GP</option>
              <option value="40GP">40GP</option>
              <option value="40HC">40HC</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Destination</label>
            <select value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} style={inputStyle}>
              {DESTINATIONS.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date départ estimée</label>
            <input type="date" value={form.date_depart_est} onChange={e => setForm({ ...form, date_depart_est: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Date arrivée estimée</label>
            <input type="date" value={form.date_arrivee_est} onChange={e => setForm({ ...form, date_arrivee_est: e.target.value })} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Section Ports */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Ports</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <DropdownPorts
            type="chargement"
            value={form.port_chargement}
            onChange={code => setForm({ ...form, port_chargement: code })}
            label="Port de chargement"
          />
          <DropdownPorts
            type="destination"
            value={form.port_destination}
            onChange={code => setForm({ ...form, port_destination: code })}
            label="Port de destination"
          />
        </div>
      </div>

      {/* Section Infos transporteur */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Informations transporteur</h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 0, marginBottom: 20 }}>
          À renseigner au départ réel du conteneur (extractible du BL PDF du transporteur).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={labelStyle}>N° Conteneur physique</label>
            <input
              type="text"
              placeholder="Ex: APHU7221859"
              value={form.num_physique}
              onChange={e => setForm({ ...form, num_physique: e.target.value.toUpperCase() })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Voyage Number</label>
            <input
              type="text"
              placeholder="Ex: 1FL2CW1MA"
              value={form.voyage_number}
              onChange={e => setForm({ ...form, voyage_number: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>BL / Waybill Number</label>
            <input
              type="text"
              placeholder="Ex: ZSN0807356"
              value={form.bl_number}
              onChange={e => setForm({ ...form, bl_number: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>SEAL Number</label>
            <input
              type="text"
              placeholder="Ex: M8764995"
              value={form.seal_number}
              onChange={e => setForm({ ...form, seal_number: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Section Statut et notes */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Statut et notes</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Statut du conteneur</label>
          <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })} style={inputStyle}>
            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Notes internes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={3}
            style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Section Devis liés (placeholder v35d) */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Devis liés à ce conteneur</h2>
        {nbDevis === 0 ? (
          <p style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>
            Aucun devis lié pour l'instant. Les liaisons se feront via les listes d'achat (v35d).
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14 }}>
            {conteneur.devis_lies.map((id: string) => (
              <li key={id}>
                <Link href={`/admin/devis/${id}`} style={{ color: '#1565C0', fontWeight: 600 }}>
                  {id}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Boutons actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1, padding: 14,
            background: saving ? '#D3D1C7' : '#EA580C',
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
        <button
          onClick={handleDelete}
          style={{
            padding: 14, background: 'transparent', color: '#DC2626',
            border: '1.5px solid #FECACA', borderRadius: 12,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
          Supprimer
        </button>
      </div>
    </div>
  );
}

function timestampToDateInput(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16,
  padding: 24, marginBottom: 20,
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16, fontWeight: 600, color: '#1E3A5F', marginTop: 0, marginBottom: 20,
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6,
  fontWeight: 600, textTransform: 'uppercase',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB',
  borderRadius: 10, fontSize: 14, background: '#fff', boxSizing: 'border-box',
};
