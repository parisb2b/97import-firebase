import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';

export default function Contact() {
  const { t } = useI18n();

  const SUBJECTS = [
    t('contact.sujets.info'),
    t('contact.sujets.devis'),
    t('contact.sujets.sav'),
    t('contact.sujets.partenaire'),
    t('contact.sujets.autre'),
  ];
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await addDoc(collection(db, 'contacts'), {
        firstName, lastName, email, phone, subject, message,
        createdAt: serverTimestamp(),
        status: 'nouveau',
      });
      setSent(true);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSending(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E5E7EB',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0B2545, #1E3A5F)', padding: '48px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <h1 style={{ color: 'white', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{t('contact.title')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>{t('contact.subtitle')}</p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 20px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>

        {/* Left — Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { icon: '📍', title: t('contact.adresse'), content: 'LUXENT LIMITED\n2nd Floor College House\n17 King Edwards Road\nRuislip HA4 7AE, London' },
            { icon: '📧', title: t('contact.email'), content: 'contact@97import.com' },
            { icon: '📱', title: t('contact.telephone'), content: 'France : +33 6 63 28 49 08\nAntilles : +596 6 96 XX XX XX' },
            { icon: '🕐', title: t('contact.horaires'), content: 'Lundi - Vendredi : 9h - 18h\nSamedi : 9h - 12h' },
          ].map(item => (
            <div key={item.title} style={{
              background: 'white', borderRadius: 16, padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', gap: 16,
            }}>
              <span style={{ fontSize: 28 }}>{item.icon}</span>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0B2545', marginBottom: 6 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.content}</p>
              </div>
            </div>
          ))}

          {/* WhatsApp */}
          <a href="https://wa.me/33663284908" target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: '#25D366', color: 'white', borderRadius: 12, padding: '16px 0',
            fontSize: 16, fontWeight: 700, textDecoration: 'none', cursor: 'pointer',
          }}>
            💬 Contacter via WhatsApp
          </a>
        </div>

        {/* Right — Form */}
        <div style={{
          background: 'white', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 32,
        }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <span style={{ fontSize: 48 }}>✅</span>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B2545', marginTop: 16 }}>Message OK!</h2>
              <p style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>&#10003;</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B2545', marginBottom: 24 }}>✉️ Envoyer un message</h2>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Prenom</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Jean" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nom</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Dupont" style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="votre@email.com" style={inputStyle} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Telephone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+596 6 00 00 00 00" style={inputStyle} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Sujet</label>
                  <select value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle}>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Message</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} required
                    rows={5} placeholder="Votre message..." style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                <button type="submit" disabled={sending} style={{
                  width: '100%', padding: '14px 0', background: '#0B2545', color: 'white', border: 'none',
                  borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: sending ? 0.5 : 1,
                }}>
                  {sending ? 'Envoi...' : '📨 Envoyer le message'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
