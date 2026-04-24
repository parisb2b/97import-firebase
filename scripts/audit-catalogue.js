// scripts/audit-catalogue.js
// Audit LECTURE SEULE du catalogue produits Firestore
// Usage : node scripts/audit-catalogue.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyD07lt6roFD8zTbSFivLw2BUVKJVVUf8Lo",
  authDomain: "importok-6ef77.firebaseapp.com",
  projectId: "importok-6ef77",
  storageBucket: "importok-6ef77.appspot.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Champs attendus v35g
const CHAMPS_ESSENTIEL = [
  'reference', 'categorie', 'nom_fr', 'prix_achat',
  'fournisseur', 'poids_brut_kg', 'volume_m3',
  'est_kit', 'composition_kit', 'actif', 'image_principale',
];

const CHAMPS_DETAILS = [
  'code_hs', 'nom_zh', 'nom_en',
  'description_courte_fr', 'description_courte_zh', 'description_courte_en',
  'usage_fr', 'usage_zh', 'usage_en',
  'longueur_cm', 'largeur_cm', 'hauteur_cm', 'poids_net_kg',
  'matiere_fr', 'matiere_zh', 'matiere_en',
  'reference_usine', 'ville_origine_cn', 'pays_origine',
  'ce_certification',
];

const CHAMPS_MEDIAS = [
  'images_galerie', 'videos_galerie', 'video_url',
  'description_marketing_fr', 'description_marketing_zh', 'description_marketing_en',
  'points_forts', 'documents_pdf',
  'slug_url', 'meta_title', 'meta_description',
];

function estVide(val, champ) {
  if (val === undefined || val === null) return true;
  if (typeof val === 'string' && val.trim() === '') return true;
  if (typeof val === 'number' && val === 0 &&
      ['prix_achat', 'poids_brut_kg', 'volume_m3', 'longueur_cm', 'largeur_cm', 'hauteur_cm', 'poids_net_kg'].includes(champ)) return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
}

async function audit() {
  console.log('🔍 Audit catalogue Firestore en cours...\n');

  const snapshot = await getDocs(collection(db, 'products'));
  const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  const report = [];
  const log = (line = '') => { console.log(line); report.push(line); };

  log('═══════════════════════════════════════════════════════════');
  log(`  AUDIT CATALOGUE PRODUITS — ${new Date().toLocaleString('fr-FR')}`);
  log(`  Firestore : importok-6ef77`);
  log('═══════════════════════════════════════════════════════════');
  log('');

  // ═══ SECTION 1 : VUE D'ENSEMBLE ═══
  log('┌────────────────────────────────────────────┐');
  log('│  1. VUE D\'ENSEMBLE                          │');
  log('└────────────────────────────────────────────┘');
  log('');
  log(`Total produits Firestore : ${products.length}`);

  const actifs = products.filter(p => p.actif === true).length;
  const masques = products.filter(p => p.actif === false).length;
  const nonDefinis = products.filter(p => p.actif === undefined || p.actif === null).length;

  log(`  ✅ Actifs  : ${actifs}`);
  log(`  ⏸️  Masqués : ${masques}`);
  log(`  ❓ Statut non défini : ${nonDefinis}`);
  log('');

  // ═══ SECTION 2 : RÉPARTITION PAR CATÉGORIE ═══
  log('┌────────────────────────────────────────────┐');
  log('│  2. RÉPARTITION PAR CATÉGORIE               │');
  log('└────────────────────────────────────────────┘');
  log('');

  const categories = {};
  products.forEach(p => {
    const cat = p.categorie || '— Non défini —';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(p);
  });

  Object.entries(categories).sort((a, b) => b[1].length - a[1].length).forEach(([cat, prods]) => {
    log(`  ${cat.padEnd(25)} : ${prods.length} produit(s)`);
  });
  log('');

  // ═══ SECTION 3 : ANALYSE PAR PRÉFIXE DE RÉFÉRENCE ═══
  log('┌────────────────────────────────────────────┐');
  log('│  3. RÉPARTITION PAR PRÉFIXE DE RÉFÉRENCE    │');
  log('└────────────────────────────────────────────┘');
  log('');

  const prefixes = {};
  products.forEach(p => {
    const ref = p.reference || p.id;
    const prefix = ref.split('-')[0] || '?';
    if (!prefixes[prefix]) prefixes[prefix] = [];
    prefixes[prefix].push(ref);
  });

  Object.entries(prefixes).sort((a, b) => b[1].length - a[1].length).forEach(([pfx, refs]) => {
    log(`  ${pfx.padEnd(10)} : ${refs.length.toString().padStart(3)} produit(s)`);
  });
  log('');

  // ═══ SECTION 4 : TAUX DE REMPLISSAGE PAR CHAMP ESSENTIEL ═══
  log('┌────────────────────────────────────────────┐');
  log('│  4. TAUX DE REMPLISSAGE — ESSENTIEL (11)    │');
  log('└────────────────────────────────────────────┘');
  log('');

  CHAMPS_ESSENTIEL.forEach(champ => {
    const remplis = products.filter(p => !estVide(p[champ], champ)).length;
    const pct = products.length > 0 ? (remplis / products.length * 100).toFixed(0) : 0;
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    log(`  ${champ.padEnd(22)} ${bar}  ${remplis}/${products.length} (${pct}%)`);
  });
  log('');

  // ═══ SECTION 5 : TAUX DE REMPLISSAGE DÉTAILS ═══
  log('┌────────────────────────────────────────────┐');
  log('│  5. TAUX DE REMPLISSAGE — DÉTAILS (20)      │');
  log('└────────────────────────────────────────────┘');
  log('');

  CHAMPS_DETAILS.forEach(champ => {
    const remplis = products.filter(p => !estVide(p[champ], champ)).length;
    const pct = products.length > 0 ? (remplis / products.length * 100).toFixed(0) : 0;
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    log(`  ${champ.padEnd(22)} ${bar}  ${remplis}/${products.length} (${pct}%)`);
  });
  log('');

  // ═══ SECTION 6 : TAUX DE REMPLISSAGE MÉDIAS ═══
  log('┌────────────────────────────────────────────┐');
  log('│  6. TAUX DE REMPLISSAGE — MÉDIAS (11)       │');
  log('└────────────────────────────────────────────┘');
  log('');

  CHAMPS_MEDIAS.forEach(champ => {
    const remplis = products.filter(p => !estVide(p[champ], champ)).length;
    const pct = products.length > 0 ? (remplis / products.length * 100).toFixed(0) : 0;
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    log(`  ${champ.padEnd(22)} ${bar}  ${remplis}/${products.length} (${pct}%)`);
  });
  log('');

  // ═══ SECTION 7 : STATUT DE COMPLÉTUDE ═══
  log('┌────────────────────────────────────────────┐');
  log('│  7. STATUT DE COMPLÉTUDE (calculé)          │');
  log('└────────────────────────────────────────────┘');
  log('');

  function calculerStatut(p) {
    const essentielRemplis = CHAMPS_ESSENTIEL.filter(c => !estVide(p[c], c)).length;
    const detailsRemplis = CHAMPS_DETAILS.filter(c => !estVide(p[c], c)).length;
    const mediasRemplis = CHAMPS_MEDIAS.filter(c => !estVide(p[c], c)).length;

    if (essentielRemplis < 11) return 'bloquant';
    if (mediasRemplis >= 3 && detailsRemplis >= 10) return 'complet';
    if (mediasRemplis >= 2) return 'pret_site';
    return 'a_enrichir';
  }

  const statuts = { complet: 0, pret_site: 0, a_enrichir: 0, bloquant: 0 };
  products.forEach(p => statuts[calculerStatut(p)]++);

  log(`  ● Complet     : ${statuts.complet.toString().padStart(3)} / ${products.length}`);
  log(`  ● Prêt site   : ${statuts.pret_site.toString().padStart(3)} / ${products.length}`);
  log(`  ● À enrichir  : ${statuts.a_enrichir.toString().padStart(3)} / ${products.length}`);
  log(`  ● Bloquant    : ${statuts.bloquant.toString().padStart(3)} / ${products.length}`);
  log('');

  // ═══ SECTION 8 : ANALYSE KITS ═══
  log('┌────────────────────────────────────────────┐');
  log('│  8. ANALYSE DES KITS                        │');
  log('└────────────────────────────────────────────┘');
  log('');

  const kits = products.filter(p => p.est_kit === true);
  log(`Kits trouvés : ${kits.length}`);

  kits.forEach(k => {
    const comp = k.composition_kit;
    let details = '';
    if (Array.isArray(comp) && comp.length > 0) {
      if (typeof comp[0] === 'string') {
        details = `⚠️ format ANCIEN (array de strings, ${comp.length})`;
      } else {
        details = `✅ format nouveau (${comp.length} composants)`;
      }
    } else {
      details = '❌ composition_kit VIDE';
    }
    log(`  ${k.reference?.padEnd(18) || k.id.padEnd(18)} → ${details}`);
  });
  log('');

  // ═══ SECTION 9 : DÉTECTION ANOMALIES ═══
  log('┌────────────────────────────────────────────┐');
  log('│  9. ANOMALIES DÉTECTÉES                     │');
  log('└────────────────────────────────────────────┘');
  log('');

  const anomalies = [];

  // Produits sans référence OU id différent de reference
  products.forEach(p => {
    if (!p.reference) {
      anomalies.push(`  ⚠️  ${p.id} : champ 'reference' manquant dans le document`);
    } else if (p.reference !== p.id) {
      anomalies.push(`  ⚠️  ID ≠ référence : doc "${p.id}" contient reference="${p.reference}"`);
    }
  });

  // Images_galerie ancien format
  const galerieAncienFormat = products.filter(p =>
    Array.isArray(p.images_galerie) &&
    p.images_galerie.length > 0 &&
    typeof p.images_galerie[0] === 'string'
  );
  if (galerieAncienFormat.length > 0) {
    anomalies.push(`  ⚠️  ${galerieAncienFormat.length} produit(s) avec images_galerie au format ANCIEN (array de strings). Sera migré auto à l'ouverture fiche.`);
  }

  // Produits actifs sans code HS
  const actifsSansCodeHs = products.filter(p => p.actif === true && estVide(p.code_hs, 'code_hs'));
  if (actifsSansCodeHs.length > 0) {
    anomalies.push(`  ⚠️  ${actifsSansCodeHs.length} produit(s) actif(s) sans code HS (bloquant pour Excel BE-EXPORT)`);
  }

  // Produits actifs sans prix_achat
  const sansPrix = products.filter(p => p.actif === true && estVide(p.prix_achat, 'prix_achat'));
  if (sansPrix.length > 0) {
    anomalies.push(`  ⚠️  ${sansPrix.length} produit(s) actif(s) sans prix_achat`);
  }

  // Produits actifs sans image_principale
  const sansImage = products.filter(p => p.actif === true && estVide(p.image_principale, 'image_principale'));
  if (sansImage.length > 0) {
    anomalies.push(`  ⚠️  ${sansImage.length} produit(s) actif(s) sans image_principale`);
  }

  // Doublons potentiels (même nom_fr)
  const nomsFr = {};
  products.forEach(p => {
    if (p.nom_fr) {
      if (!nomsFr[p.nom_fr]) nomsFr[p.nom_fr] = [];
      nomsFr[p.nom_fr].push(p.reference || p.id);
    }
  });
  const doublons = Object.entries(nomsFr).filter(([_, refs]) => refs.length > 1);
  if (doublons.length > 0) {
    anomalies.push(`  ⚠️  ${doublons.length} nom(s) produit en doublon :`);
    doublons.slice(0, 5).forEach(([nom, refs]) => {
      anomalies.push(`       "${nom}" → ${refs.join(', ')}`);
    });
  }

  if (anomalies.length === 0) {
    log('  ✅ Aucune anomalie détectée');
  } else {
    anomalies.forEach(a => log(a));
  }
  log('');

  // ═══ SECTION 10 : TOP 10 PRODUITS LES PLUS/MOINS REMPLIS ═══
  log('┌────────────────────────────────────────────┐');
  log('│  10. TOP PRODUITS                           │');
  log('└────────────────────────────────────────────┘');
  log('');

  const tous = products.map(p => {
    const ess = CHAMPS_ESSENTIEL.filter(c => !estVide(p[c], c)).length;
    const det = CHAMPS_DETAILS.filter(c => !estVide(p[c], c)).length;
    const med = CHAMPS_MEDIAS.filter(c => !estVide(p[c], c)).length;
    const total = ess + det + med;
    return {
      ref: p.reference || p.id,
      nom: p.nom_fr || '—',
      ess, det, med, total,
      statut: calculerStatut(p),
    };
  });

  log('  TOP 10 — PRODUITS LES MIEUX REMPLIS :');
  tous.sort((a, b) => b.total - a.total).slice(0, 10).forEach((p, i) => {
    log(`    ${(i+1).toString().padStart(2)}. ${p.ref.padEnd(18)} — ${p.nom.substring(0, 30).padEnd(30)} ${p.total}/42  (E:${p.ess} D:${p.det} M:${p.med})`);
  });
  log('');

  log('  TOP 10 — PRODUITS LES PLUS À ENRICHIR :');
  tous.sort((a, b) => a.total - b.total).slice(0, 10).forEach((p, i) => {
    log(`    ${(i+1).toString().padStart(2)}. ${p.ref.padEnd(18)} — ${p.nom.substring(0, 30).padEnd(30)} ${p.total}/42  (E:${p.ess} D:${p.det} M:${p.med})`);
  });
  log('');

  // ═══ SECTION 11 : RECOMMANDATIONS D'ENRICHISSEMENT ═══
  log('┌────────────────────────────────────────────┐');
  log('│  11. RECOMMANDATIONS PRIORITAIRES           │');
  log('└────────────────────────────────────────────┘');
  log('');

  log('Pour que TES EXCEL soient complets (BC-CHINE, BE-EXPORT, etc.), les champs');
  log('suivants sont critiques. Priorise-les dans ton enrichissement :');
  log('');
  log('  PRIORITÉ 1 (essentiels douane chinoise BE-EXPORT) :');
  log(`    code_hs           : ${products.filter(p => !estVide(p.code_hs, 'code_hs')).length}/${products.length} remplis`);
  log(`    nom_zh            : ${products.filter(p => !estVide(p.nom_zh, 'nom_zh')).length}/${products.length} remplis`);
  log(`    usage_zh          : ${products.filter(p => !estVide(p.usage_zh, 'usage_zh')).length}/${products.length} remplis`);
  log(`    ville_origine_cn  : ${products.filter(p => !estVide(p.ville_origine_cn, 'ville_origine_cn')).length}/${products.length} remplis`);
  log('');
  log('  PRIORITÉ 2 (Packing List et logistique) :');
  log(`    longueur_cm       : ${products.filter(p => !estVide(p.longueur_cm, 'longueur_cm')).length}/${products.length} remplis`);
  log(`    largeur_cm        : ${products.filter(p => !estVide(p.largeur_cm, 'largeur_cm')).length}/${products.length} remplis`);
  log(`    hauteur_cm        : ${products.filter(p => !estVide(p.hauteur_cm, 'hauteur_cm')).length}/${products.length} remplis`);
  log(`    poids_net_kg      : ${products.filter(p => !estVide(p.poids_net_kg, 'poids_net_kg')).length}/${products.length} remplis`);
  log('');
  log('  PRIORITÉ 3 (marketing site public) :');
  log(`    description_marketing_fr : ${products.filter(p => !estVide(p.description_marketing_fr, 'description_marketing_fr')).length}/${products.length} remplis`);
  log(`    images_galerie    : ${products.filter(p => !estVide(p.images_galerie, 'images_galerie')).length}/${products.length} remplis`);
  log(`    videos_galerie    : ${products.filter(p => !estVide(p.videos_galerie, 'videos_galerie')).length}/${products.length} remplis`);
  log('');

  // ═══ SECTION 12 : LISTE COMPLÈTE DES RÉFÉRENCES ═══
  log('┌────────────────────────────────────────────┐');
  log('│  12. LISTE COMPLÈTE DES RÉFÉRENCES          │');
  log('└────────────────────────────────────────────┘');
  log('');

  products.sort((a, b) => (a.reference || a.id).localeCompare(b.reference || b.id)).forEach(p => {
    const statut = calculerStatut(p);
    const emoji = { complet: '✅', pret_site: '🟦', a_enrichir: '🟡', bloquant: '🔴' }[statut];
    const actif = p.actif === true ? 'ACTIF  ' : '       ';
    const kit = p.est_kit === true ? '[KIT] ' : '      ';
    log(`  ${emoji} ${actif}${kit}${(p.reference || p.id).padEnd(20)} — ${(p.nom_fr || '—').substring(0, 45)}`);
  });
  log('');

  // ═══ FIN ═══
  log('═══════════════════════════════════════════════════════════');
  log('  FIN DE L\'AUDIT');
  log('═══════════════════════════════════════════════════════════');

  // Écriture rapport
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `AUDIT-CATALOGUE-${dateStr}.TXT`;
  fs.writeFileSync(fileName, report.join('\n'));

  console.log('');
  console.log(`✅ Rapport complet écrit dans : ${fileName}`);
  console.log(`   Le fichier fait ${report.length} lignes`);
}

audit().catch(err => {
  console.error('❌ Erreur audit :', err);
  process.exit(1);
});
