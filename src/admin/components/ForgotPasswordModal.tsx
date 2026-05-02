// V50-BIS Checkpoint B — Modal "Mot de passe oublie" pour /admin/login.
// Envoie un email Firebase Auth de reinitialisation password (sendPasswordResetEmail).
//
// Securite : ne JAMAIS reveler si l'email existe ou pas en BD. Toujours
// afficher un message generique "Si un compte existe, un email a ete envoye"
// — meme en cas d'erreur Firebase (auth/user-not-found, etc.). Seule
// l'erreur auth/invalid-email retourne un feedback specifique (UX format).
//
// Accessibilite : escape ferme la modal, focus sur input email a l'ouverture.

import { useState, useEffect, useRef } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { adminAuth } from '../../lib/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export default function ForgotPasswordModal({ isOpen, onClose, defaultEmail = '' }: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state quand on rouvre
  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail);
      setSuccess(false);
      setError(null);
      setLoading(false);
      // Auto-focus input email a l'ouverture
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultEmail]);

  // Escape ferme la modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateEmail = (value: string) => {
    // Regex simple : 1+ char @ 1+ char . 2+ char
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Veuillez saisir une adresse email.');
      return;
    }
    if (!validateEmail(trimmed)) {
      setError('Adresse email invalide.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(adminAuth, trimmed);
      setSuccess(true);
    } catch (err: any) {
      // Securite : NE PAS reveler si l'email existe ou non.
      // Tout message generique sauf invalid-email (deja filtre ci-dessus
      // mais double garde si Firebase renvoie cette erreur).
      const code = err?.code;
      if (code === 'auth/invalid-email') {
        setError('Adresse email invalide.');
        setLoading(false);
        return;
      }
      // Pour TOUTES les autres erreurs (user-not-found, network, etc.)
      // on affiche success generique pour eviter le leak.
      console.warn('[ForgotPasswordModal] Erreur Firebase :', code, err?.message);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="v45-fade-in"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(11, 37, 69, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 20,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14,
          padding: 28, maxWidth: 460, width: '100%',
          fontFamily: 'inherit',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ textAlign: 'center', fontSize: 32, marginBottom: 12 }} aria-hidden>🔑</div>
        <h2
          id="forgot-password-title"
          style={{ margin: 0, marginBottom: 8, color: '#1565C0', textAlign: 'center', fontSize: 19, fontWeight: 700 }}
        >
          Mot de passe oublié
        </h2>

        {success ? (
          <>
            <div style={{
              padding: '14px 16px', marginTop: 16, marginBottom: 18,
              background: '#D1FAE5', border: '1px solid #10B981',
              borderRadius: 10, color: '#065F46', fontSize: 13, lineHeight: 1.5,
            }}>
              ✅ Si un compte existe avec cette adresse,
              un lien de réinitialisation vient d'être envoyé.
              Vérifiez votre boîte mail (et les spams).
            </div>
            <button
              onClick={onClose}
              className="v45-trans-fast v45-focus v45-btn-primary"
              style={{
                width: '100%', padding: '11px 18px',
                background: '#1565C0', color: '#fff', border: 'none',
                borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Fermer
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.5, marginTop: 8, marginBottom: 18 }}>
              Saisissez votre adresse email administrateur. Nous vous enverrons
              un lien sécurisé pour définir un nouveau mot de passe.
            </p>

            <label style={{ display: 'block', fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 6 }}>
              Email administrateur
            </label>
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parisb2b@gmail.com"
              autoComplete="email"
              disabled={loading}
              className="v45-input"
              style={{
                width: '100%', padding: '10px 12px',
                border: '1px solid #E5E7EB', borderRadius: 10,
                fontSize: 14, fontFamily: 'inherit',
                outline: 'none', boxSizing: 'border-box',
                marginBottom: 14,
              }}
            />

            {error && (
              <div style={{
                padding: '10px 14px', marginBottom: 14,
                background: '#FEE2E2', border: '1px solid #FCA5A5',
                borderRadius: 8, color: '#991B1B', fontSize: 13,
              }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="v45-trans-fast v45-focus v45-btn-ghost"
                style={{
                  padding: '10px 18px',
                  background: 'transparent', color: '#475569',
                  border: '1.5px solid #CBD5E1', borderRadius: 10,
                  fontSize: 13, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="v45-trans-fast v45-focus v45-btn-primary"
                style={{
                  padding: '10px 22px',
                  background: '#1565C0', color: '#fff',
                  border: 'none', borderRadius: 10,
                  fontSize: 13, fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}
              >
                {loading && <span className="v45-spinner" aria-hidden />}
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
