import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, runTransaction } from 'firebase/firestore';
import { db, clientAuth } from '@/lib/firebase';

interface CartItem {
  ref: string;
  nom_fr: string;
  prix_unitaire: number;
  qte: number;
  categorie?: string;
}

interface Props {
  items: CartItem[];
  total: number;
  onClose: () => void;
  onSuccess: (quoteNumber: string) => void;
}

type Step = 0 | 1 | 2 | 3;

export default function TunnelCommande({ items, total, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [hasPartner, setHasPartner] = useState<'yes' | 'no' | null>(null);
  const [accountType, setAccountType] = useState<'perso' | 'pro'>('perso');
  const [rib, setRib] = useState({ titulaire: '', iban: '', bic: '' });
  const [customerInfo, setCustomerInfo] = useState({
    nom: '', email: '', tel: '', adresse: '', ville: '', cp: '',
    destination: 'martinique',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'partners'), where('actif', '==', true)));
        setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const user = clientAuth.currentUser;
    if (user?.email) {
      setCustomerInfo(prev => ({ ...prev, email: user.email || '' }));
    }
  }, []);

  const handleSubmit = async () => {
    if (!customerInfo.nom || !customerInfo.email) {
      alert('Nom et email obligatoires');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const aamm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const counterRef = doc(db, 'counters', `dvs_${aamm}`);

      const numero = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(counterRef);
        const current = snap.exists() ? (snap.data().value || 0) : 0;
        const next = current + 1;
        transaction.set(counterRef, { value: next, prefix: 'DVS', period: aamm }, { merge: true });
        return `DVS-${aamm}-${String(next).padStart(3, '0')}`;
      });

      const user = clientAuth.currentUser;
      await addDoc(collection(db, 'quotes'), {
        numero,
        client_id: user?.uid || null,
        client_nom: customerInfo.nom,
        client_email: customerInfo.email,
        client_tel: customerInfo.tel,
        client_adresse: customerInfo.adresse,
        client_ville: customerInfo.ville,
        client_cp: customerInfo.cp,
        destination: customerInfo.destination,
        partenaire_code: selectedPartner?.code || null,
        partenaire_id: selectedPartner?.id || null,
        compte_type: accountType,
        rib: accountType === 'pro' ? rib : null,
        statut: 'nouveau',
        is_vip: false,
        total_ht: total,
        lignes: items.map(it => ({
          ref: it.ref, nom_fr: it.nom_fr, prix_unitaire: it.prix_unitaire,
          qte: it.qte, categorie: it.categorie,
        })),
        acomptes: [],
        createdAt: serverTimestamp(),
      });

      try {
        await addDoc(collection(db, 'mail'), {
          to: customerInfo.email,
          message: {
            subject: `Confirmation devis ${numero}`,
            html: `<h2 style="color:#1565C0">Merci pour votre demande</h2>
              <p>Bonjour ${customerInfo.nom},</p>
              <p>Votre devis <strong>${numero}</strong> a été reçu.</p>
              <p>Notre équipe vous recontactera sous 24h.</p>
              <ul><li>${items.length} article(s)</li>
              <li>Total HT : ${total.toLocaleString('fr-FR')} €</li>
              <li>Destination : ${customerInfo.destination}</li></ul>`,
          },
        });
      } catch {}

      onSuccess(numero);
    } catch (err: any) {
      alert('Erreur : ' + err.message);
      setSubmitting(false);
    }
  };

  const canNext =
    (step === 0 && hasPartner !== null && (hasPartner === 'no' || selectedPartner)) ||
    (step === 1 && customerInfo.nom && customerInfo.email) ||
    (step === 2);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: 640, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          padding: 20, borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: 'var(--blue)' }}>Demande de devis</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
              Étape {step + 1}/4 — {['Partenaire', 'Coordonnées', 'Mode paiement', 'Confirmation'][step]}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', fontSize: 24,
            cursor: 'pointer', color: 'var(--text-3)', padding: 0,
          }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '0 20px 16px' }}>
          {[0, 1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step ? 'var(--orange)' : 'var(--border)',
            }} />
          ))}
        </div>

        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {step === 0 && (
            <>
              <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>Avez-vous un code partenaire ?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                Si vous avez été référé par un partenaire 97import, indiquez-le ici pour bénéficier de prix négociés.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <RadioOption active={hasPartner === 'yes'} onClick={() => setHasPartner('yes')} label="Oui, j'ai un code partenaire" />
                <RadioOption active={hasPartner === 'no'} onClick={() => { setHasPartner('no'); setSelectedPartner(null); }} label="Non, je n'ai pas de code" />
              </div>
              {hasPartner === 'yes' && (
                <div style={{ marginTop: 16 }}>
                  <label style={fieldLabelStyle}>Sélectionnez votre partenaire</label>
                  <select value={selectedPartner?.id || ''}
                    onChange={e => {
                      const p = partners.find(pp => pp.id === e.target.value);
                      setSelectedPartner(p || null);
                    }} style={inputStyle}>
                    <option value="">— Choisir —</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.code} — {p.nom}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>Vos coordonnées</h3>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                Pour vous envoyer le devis et organiser la livraison.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Nom complet *"><input value={customerInfo.nom} onChange={e => setCustomerInfo({ ...customerInfo, nom: e.target.value })} style={inputStyle} placeholder="Jean Dupont" /></Field>
                <Field label="Email *"><input type="email" value={customerInfo.email} onChange={e => setCustomerInfo({ ...customerInfo, email: e.target.value })} style={inputStyle} /></Field>
                <Field label="Téléphone"><input type="tel" value={customerInfo.tel} onChange={e => setCustomerInfo({ ...customerInfo, tel: e.target.value })} style={inputStyle} placeholder="+596 696 XX XX XX" /></Field>
                <Field label="Destination *">
                  <select value={customerInfo.destination} onChange={e => setCustomerInfo({ ...customerInfo, destination: e.target.value })} style={inputStyle}>
                    <option value="martinique">Martinique</option>
                    <option value="guadeloupe">Guadeloupe</option>
                    <option value="guyane">Guyane</option>
                    <option value="reunion">Réunion</option>
                    <option value="france">France métropolitaine</option>
                  </select>
                </Field>
                <div style={{ gridColumn: 'span 2' }}>
                  <Field label="Adresse"><input value={customerInfo.adresse} onChange={e => setCustomerInfo({ ...customerInfo, adresse: e.target.value })} style={inputStyle} placeholder="N° et rue" /></Field>
                </div>
                <Field label="Ville"><input value={customerInfo.ville} onChange={e => setCustomerInfo({ ...customerInfo, ville: e.target.value })} style={inputStyle} /></Field>
                <Field label="Code postal"><input value={customerInfo.cp} onChange={e => setCustomerInfo({ ...customerInfo, cp: e.target.value })} style={inputStyle} /></Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>Type de compte pour acompte</h3>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                Vous paierez un acompte de 30% pour valider la commande.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <RadioOption active={accountType === 'perso'} onClick={() => setAccountType('perso')} label={<span><strong>Compte personnel</strong><br/><span style={{ fontSize: 12, color: 'var(--text-3)' }}>Particulier</span></span>} />
                <RadioOption active={accountType === 'pro'} onClick={() => setAccountType('pro')} label={<span><strong>Compte professionnel</strong><br/><span style={{ fontSize: 12, color: 'var(--text-3)' }}>Entreprise, RIB requis</span></span>} />
              </div>
              {accountType === 'pro' && (
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Titulaire"><input value={rib.titulaire} onChange={e => setRib({ ...rib, titulaire: e.target.value })} style={inputStyle} placeholder="Nom de l'entreprise" /></Field>
                  <Field label="IBAN"><input value={rib.iban} onChange={e => setRib({ ...rib, iban: e.target.value })} style={inputStyle} placeholder="FR76 ..." /></Field>
                  <Field label="BIC"><input value={rib.bic} onChange={e => setRib({ ...rib, bic: e.target.value })} style={inputStyle} placeholder="BNPAFRPP" /></Field>
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>Récapitulatif</h3>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                Vérifiez avant de soumettre.
              </p>
              <div style={{
                background: 'var(--bg-2)', padding: 20, borderRadius: 'var(--radius)',
                display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16,
              }}>
                <Recap label="Articles" value={`${items.length} article(s)`} />
                <Recap label="Total HT" value={`${total.toLocaleString('fr-FR')} €`} highlight />
                <Recap label="Destination" value={customerInfo.destination} />
                <Recap label="Client" value={customerInfo.nom} />
                <Recap label="Email" value={customerInfo.email} />
                {selectedPartner && <Recap label="Partenaire" value={`${selectedPartner.code} — ${selectedPartner.nom}`} />}
                <Recap label="Mode acompte" value={accountType === 'perso' ? 'Personnel' : 'Professionnel'} />
              </div>
              <div style={{
                padding: 16, background: 'var(--blue-light)', borderRadius: 'var(--radius)',
                borderLeft: '4px solid var(--blue)', fontSize: 13,
              }}>
                <strong>📧 Devis envoyé par email sous 24h ouvrées.</strong>
              </div>
            </>
          )}
        </div>

        <div style={{
          padding: 16, borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10, background: 'var(--bg-2)',
        }}>
          {step > 0 && (
            <button onClick={() => setStep((step - 1) as Step)} style={{
              padding: '10px 16px', background: '#fff', color: 'var(--text-2)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}>← Précédent</button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep((step + 1) as Step)} disabled={!canNext} style={{
              padding: '10px 24px', background: 'var(--orange)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius)', fontSize: 14,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              marginLeft: 'auto', opacity: canNext ? 1 : 0.5,
            }}>Suivant →</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} style={{
              padding: '10px 24px', background: submitting ? 'var(--border)' : 'var(--success)',
              color: '#fff', border: 'none', borderRadius: 'var(--radius)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', marginLeft: 'auto',
            }}>{submitting ? 'Envoi...' : '✅ Soumettre'}</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div><label style={fieldLabelStyle}>{label}</label>{children}</div>;
}

function RadioOption({ active, onClick, label }: any) {
  return (
    <label onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 14,
      border: `2px solid ${active ? 'var(--orange)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', cursor: 'pointer',
      background: active ? 'var(--orange-light)' : 'transparent',
    }}>
      <input type="radio" checked={active} onChange={() => {}} />
      {typeof label === 'string' ? <span>{label}</span> : label}
    </label>
  );
}

function Recap({ label, value, highlight }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
      <span>{label}</span>
      <strong style={{ color: highlight ? 'var(--blue)' : undefined, fontSize: highlight ? 16 : 14 }}>
        {value}
      </strong>
    </div>
  );
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', fontSize: 14, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
};
