import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';
import { getNextNumber } from '../../../lib/counters';
import { useToast } from '../../components/Toast';

interface Props {
  userId: string;
  profile: any;
  commandes: { id: string; numero: string; mainProduct: string }[];
  onClose: () => void;
  onSavCreated: () => void;
}

const TYPES_PROBLEME = ['Panne', 'Pièce manquante', 'Dommage livraison', 'Garantie', 'Autre'];

export default function PopupSAV({ userId, profile, commandes, onClose, onSavCreated }: Props) {
  const { showToast } = useToast();
  const [commandeRef, setCommandeRef] = useState(commandes[0]?.numero || '');
  const [devisId, setDevisId] = useState(commandes[0]?.id || '');
  const [typeProbleme, setTypeProbleme] = useState(TYPES_PROBLEME[0]);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [telephone, setTelephone] = useState(profile?.phone || profile?.telephone || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async () => {
    if (!description.trim()) { showToast('Veuillez décrire le problème', 'error'); return; }
    setSubmitting(true);
    try {
      const savNumero = await getNextNumber('SAV');
      const savId = savNumero.replace('-', '_');

      // Upload photos
      const photosUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const fileRef = ref(storage, `sav/${savId}/photo_${i + 1}.${files[i].name.split('.').pop()}`);
        await uploadBytes(fileRef, files[i]);
        const url = await getDownloadURL(fileRef);
        photosUrls.push(url);
      }

      // Create SAV document
      await addDoc(collection(db, 'sav'), {
        numero: savNumero,
        userId,
        email,
        nom: profile?.lastName || profile?.nom || '',
        prenom: profile?.firstName || profile?.prenom || '',
        telephone,
        commande_ref: commandeRef,
        devis_id: devisId,
        type_probleme: typeProbleme,
        description,
        photos_urls: photosUrls,
        statut: 'nouveau',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      showToast('Demande SAV envoyée ✅');
      onSavCreated();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de l\'envoi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB',
    fontSize: 13, outline: 'none', background: '#fff',
  } as const;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(11,37,69,.6)', backdropFilter: 'blur(5px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.28)' }}>
        <div style={{ fontSize: 26, marginBottom: 10 }}>🔧</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1565C0', marginBottom: 4 }}>Nouvelle demande SAV</h2>
        <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>Décrivez votre problème et nous reviendrons vers vous rapidement.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Commande */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Commande concernée</label>
            <select
              value={commandeRef}
              onChange={e => {
                setCommandeRef(e.target.value);
                const cmd = commandes.find(c => c.numero === e.target.value);
                if (cmd) setDevisId(cmd.id);
              }}
              style={inputStyle}
            >
              {commandes.map(c => (
                <option key={c.id} value={c.numero}>{c.numero} — {c.mainProduct}</option>
              ))}
              {commandes.length === 0 && <option value="">Aucune commande</option>}
            </select>
          </div>

          {/* Type problème */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Type de problème</label>
            <select value={typeProbleme} onChange={e => setTypeProbleme(e.target.value)} style={inputStyle}>
              {TYPES_PROBLEME.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Description détaillée</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={4} placeholder="Décrivez le problème en détail..."
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Photos */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Photos / fichiers</label>
            <input type="file" multiple onChange={handleFileChange} accept="image/*,.pdf"
              style={{ fontSize: 13 }} />
            {files.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {files.map((f, i) => (
                  <span key={i} style={{ fontSize: 11, background: '#F3F4F6', padding: '4px 10px', borderRadius: 8, color: '#374151' }}>
                    📎 {f.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Téléphone + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Téléphone</label>
              <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 20 }}>
          <button onClick={handleSubmit} disabled={submitting} style={{
            width: '100%', padding: 14, background: 'linear-gradient(135deg, #1565C0, #1E88E5)', color: '#fff',
            border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer',
            opacity: submitting ? 0.7 : 1, marginBottom: 8,
          }}>
            Envoyer la demande SAV
          </button>
          <button onClick={onClose} style={{
            width: '100%', padding: 14, background: 'transparent', color: '#6B7280',
            border: '1.5px solid #CBD5E1', borderRadius: 12, fontSize: 14, cursor: 'pointer',
          }}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
