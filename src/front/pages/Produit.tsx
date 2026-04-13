import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, clientAuth } from '../../lib/firebase';
import Breadcrumb from '../components/Breadcrumb';
import PriceDisplay from '../components/PriceDisplay';

export default function Produit() {
  const [, params] = useRoute('/produit/:id');
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [_user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasAccessoires, setHasAccessoires] = useState(false);
  const [accCount, setAccCount] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(clientAuth, (u) => {
      setUser(u);
      setUserRole(u ? 'user' : null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'products', params.id));
        if (snap.exists()) {
          const p: any = { id: snap.id, ...snap.data() };
          setProduct(p);

          // Check for accessories
          const accQ = query(collection(db, 'products'), where('machine_compatible', '==', p.gamme || p.id));
          const accSnap = await getDocs(accQ);
          setHasAccessoires(accSnap.size > 0);
          setAccCount(accSnap.size);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    setSelectedImg(0);
  }, [params?.id]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>;
  if (!product) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Produit non trouvé</div>;

  const images = product.images_urls || [];
  const specs = [
    product.poids_net_kg && { label: 'Poids net', value: `${product.poids_net_kg} kg` },
    product.poids_brut_kg && { label: 'Poids brut', value: `${product.poids_brut_kg} kg` },
    product.longueur_cm && { label: 'Longueur', value: `${product.longueur_cm} cm` },
    product.largeur_cm && { label: 'Largeur', value: `${product.largeur_cm} cm` },
    product.hauteur_cm && { label: 'Hauteur', value: `${product.hauteur_cm} cm` },
    product.volume_m3 && { label: 'Volume', value: `${product.volume_m3} m³` },
    product.marque && { label: 'Marque', value: product.marque },
    product.matiere_fr && { label: 'Matière', value: product.matiere_fr },
    product.code_hs && { label: 'Code HS', value: product.code_hs },
    product.ce_certification && { label: 'Certification', value: product.ce_certification },
  ].filter(Boolean);

  return (
    <>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0B2545, #1E3A5F)', padding: '24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <Breadcrumb items={[
            { label: 'Accueil', href: '/' },
            { label: product.categorie || 'Catalogue', href: `/catalogue/${product.categorie || ''}` },
            { label: product.nom_fr || product.nom || product.numero_interne },
          ]} />
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 20px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>

        {/* Left — Gallery */}
        <div>
          <div style={{ borderRadius: 16, overflow: 'hidden', background: '#F9FAFB', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {images[selectedImg] ? (
              <img src={images[selectedImg]} alt={product.nom_fr} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: 80, color: '#D1D5DB' }}>📦</span>
            )}
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {images.map((img: string, i: number) => (
                <div key={i} onClick={() => setSelectedImg(i)}
                  style={{
                    width: 64, height: 64, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                    border: selectedImg === i ? '2px solid #0B2545' : '2px solid transparent',
                  }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Info */}
        <div>
          {product.marque && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0FDF4', padding: '4px 12px', borderRadius: 20, fontSize: 12, color: '#166534', marginBottom: 12 }}>
              ✅ {product.marque} · Importation directe Chine
            </div>
          )}

          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0B2545', marginBottom: 8, lineHeight: 1.2 }}>
            {product.nom_fr || product.nom || product.numero_interne}
          </h1>

          {product.gamme && (
            <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 20 }}>
              Gamme {product.gamme} · {product.categorie}
            </p>
          )}

          {/* Price block */}
          <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <PriceDisplay product={product} userRole={userRole} size="lg" />
          </div>

          {/* Action buttons */}
          {userRole && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button style={{
                flex: 1, background: '#EA580C', color: 'white', border: 'none', borderRadius: 10,
                padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}>
                🛒 Ajouter au panier
              </button>
              <Link href="/panier">
                <button style={{
                  background: '#0B2545', color: 'white', border: 'none', borderRadius: 10,
                  padding: '14px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}>
                  📋 Devis
                </button>
              </Link>
            </div>
          )}

          {/* Specs */}
          {specs.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0B2545', marginBottom: 12 }}>Caractéristiques techniques</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {specs.map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: i % 2 === 0 ? '#F9FAFB' : 'white', borderRadius: 6 }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0B2545' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description_fr && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0B2545', marginBottom: 8 }}>Description</h3>
              <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6 }}>{product.description_fr}</p>
            </div>
          )}

          {/* Accessoires banner */}
          {hasAccessoires && (
            <Link href={`/catalogue/${product.categorie}`}>
              <div style={{
                background: 'linear-gradient(135deg, #1E3A5F, #0B2545)', borderRadius: 12,
                padding: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>
                    🔧 Accessoires compatibles {product.gamme || product.nom_fr}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
                    {accCount} accessoires disponibles — Godets, grappins, marteaux...
                  </div>
                </div>
                <span style={{ color: 'white', fontSize: 24 }}>→</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
