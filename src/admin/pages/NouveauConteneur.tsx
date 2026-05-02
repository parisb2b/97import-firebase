import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { adminDb as db } from '../../lib/firebase';
import { getNextNumber } from '../../lib/counters';
import DropdownPorts from '../components/DropdownPorts';

const TYPES_CONTENEUR = ['20GP', '40GP', '40HC'];
const DESTINATIONS = [
  { code: 'MQ', label: '🇲🇶 Martinique' },
  { code: 'GP', label: '🇬🇵 Guadeloupe' },
  { code: 'GF', label: '🇬🇫 Guyane' },
  { code: 'RE', label: '🇷🇪 Réunion' },
  { code: 'FR', label: '🇫🇷 France Métropolitaine' },
];

export default function NouveauConteneur() {
  const [, setLocation] = useLocation();
  const [saving, setSaving] = useState(false);
  const [tarifs, setTarifs] = useState<any[]>([]);

  const [form, setForm] = useState({
    type: '40HC',
    destination: 'MQ',
    date_depart_est: '',
    date_arrivee_est: '',
    port_chargement: 'YANTIAN',
    port_destination: '',
    tarif_logistique_ref: '',
    notes: '',
  });

  // Charger les tarifs logistiques actifs pour la destination
  useEffect(() => {
    const loadTarifs = async () => {
      try {
        const q = query(
          collection(db, 'tarifs_logistiques'),
          where('destination', '==', form.destination),
          where('statut', '==', 'ACTIF')
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTarifs(list);

        // Pré-sélectionner le premier tarif si aucun
        if (list.length > 0 && !form.tarif_logistique_ref) {
          setForm(f => ({ ...f, tarif_logistique_ref: (list[0] as any).reference }));
        }
      } catch (err) {
        console.error('Erreur chargement tarifs:', err);
      }
    };
    loadTarifs();
  }, [form.destination]);

  // Pré-sélectionner port destination selon destination pays
  useEffect(() => {
    const portMap: Record<string, string> = {
      MQ: 'MQFDF',
      GP: 'GPPTP',
      GF: 'GFCAY',
      RE: 'REUPSD',
      FR: 'FRLEH',
    };
    if (portMap[form.destination] && !form.port_destination) {
      setForm(f => ({ ...f, port_destination: portMap[form.destination] }));
    }
  }, [form.destination]);

  const handleSubmit = async () => {
    // Validation
    if (!form.type || !form.destination) {
      alert('Type et destination sont obligatoires');
      return;
    }
    if (!form.date_depart_est || !form.date_arrivee_est) {
      alert('Les dates estimées départ/arrivée sont obligatoires');
      return;
    }

    setSaving(true);
    try {
      // Générer le numéro CTN auto
      const numero = await getNextNumber('CTN'); // format CTN-YYMMNNN

      const dateDepart = form.date_depart_est ? Timestamp.fromDate(new Date(form.date_depart_est)) : null;
      const dateArrivee = form.date_arrivee_est ? Timestamp.fromDate(new Date(form.date_arrivee_est)) : null;

      await setDoc(doc(db, 'conteneurs', numero), {
        numero,
        type: form.type,
        destination: form.destination,
        date_depart_est: dateDepart,
        date_arrivee_est: dateArrivee,
        port_chargement: form.port_chargement,
        port_destination: form.port_destination,
        tarif_logistique_ref: form.tarif_logistique_ref,
        notes: form.notes,
        // Infos transporteur vides (à renseigner plus tard)
        num_physique: '',
        voyage_number: '',
        bl_number: '',
        seal_number: '',
        statut: 'preparation',
        devis_lies: [],
        produits_lignes: [],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      alert(`Conteneur ${numero} créé avec succès !`);
      setLocation(`/admin/conteneurs/${numero}`);
    } catch (err: any) {
      console.error('Erreur création conteneur:', err);
      alert('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const tarifSelectionne = tarifs.find((t: any) => t.reference === form.tarif_logistique_ref);

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Link href="/admin/conteneurs">
          <button style={{
            background: 'transparent', border: 'none', color: '#6B7280',
            fontSize: 14, cursor: 'pointer', padding: 0,
          }}>
            ← Retour
          </button>
        </Link>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1565C0', marginBottom: 4 }}>
        Nouveau conteneur
      </h1>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 32 }}>
        Renseignez les informations de base. Les infos transporteur (APHU, voyage, BL, seal) pourront être ajoutées plus tard au départ réel.
      </p>

      {/* Informations principales */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Informations principales</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={labelStyle}>Type de conteneur *</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
              {TYPES_CONTENEUR.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Destination *</label>
            <select value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} style={inputStyle}>
              {DESTINATIONS.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
          <div>
            <label style={labelStyle}>Date départ estimée *</label>
            <input type="date" value={form.date_depart_est} onChange={e => setForm({ ...form, date_depart_est: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Date arrivée estimée *</label>
            <input type="date" value={form.date_arrivee_est} onChange={e => setForm({ ...form, date_arrivee_est: e.target.value })} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Ports */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Ports de chargement et destination</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <DropdownPorts
            type="chargement"
            value={form.port_chargement}
            onChange={code => setForm({ ...form, port_chargement: code })}
            label="Port de chargement (Chine)"
            required
          />
          <DropdownPorts
            type="destination"
            value={form.port_destination}
            onChange={code => setForm({ ...form, port_destination: code })}
            label="Port de destination"
            required
          />
        </div>
      </div>

      {/* Tarif logistique */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Tarif logistique applicable</h2>

        {tarifs.length === 0 ? (
          <p style={{ color: '#DC2626', fontSize: 13 }}>
            Aucun tarif ACTIF pour la destination {form.destination}.
            Créez un tarif dans la gestion des tarifs logistiques.
          </p>
        ) : (
          <>
            <select
              value={form.tarif_logistique_ref}
              onChange={e => setForm({ ...form, tarif_logistique_ref: e.target.value })}
              style={inputStyle}
            >
              {tarifs.map((t: any) => (
                <option key={t.reference} value={t.reference}>
                  {t.reference} — {t.type_conteneur} {t.periode} — {t.total_eur}€
                </option>
              ))}
            </select>

            {tarifSelectionne && (
              <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 10, marginTop: 12, fontSize: 13 }}>
                <div style={{ color: '#6B7280', marginBottom: 8 }}>Détail du tarif sélectionné :</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div><strong>Fret :</strong> {tarifSelectionne.fret_eur}€</div>
                  <div><strong>Dédouanement :</strong> {tarifSelectionne.dedouanement_eur}€</div>
                  <div><strong>Services :</strong> {tarifSelectionne.services_eur}€</div>
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
                  <strong style={{ color: '#EA580C' }}>Total : {tarifSelectionne.total_eur}€</strong>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notes */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Notes internes (optionnel)</h2>
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={3}
          placeholder="Remarques internes sur ce conteneur..."
          style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            flex: 1, padding: 14,
            background: saving ? '#D3D1C7' : '#EA580C',
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
          {saving ? 'Création en cours...' : 'Créer le conteneur'}
        </button>
        <Link href="/admin/conteneurs">
          <button style={{
            padding: 14, background: 'transparent', color: '#6B7280',
            border: '1.5px solid #E5E7EB', borderRadius: 12,
            fontSize: 14, cursor: 'pointer',
          }}>
            Annuler
          </button>
        </Link>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 16,
  padding: 24,
  marginBottom: 20,
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16, fontWeight: 600, color: '#1565C0', marginTop: 0, marginBottom: 20,
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #E5E7EB',
  borderRadius: 10,
  fontSize: 14,
  background: '#fff',
  boxSizing: 'border-box',
};
