import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, limit } from 'firebase/firestore';
import { Link } from 'wouter';
import { db } from '../../lib/firebase';
import {
  Kpi,
  Card,
  Button,
  Pill,
  IconButton,
  EyeIcon,
  Progress,
} from '../components/Icons';

interface Stats {
  devisTotal: number;
  devisEnAttente: number;
  devisVip: number;
  devisStd: number;
  caEncaisse: number;
  soldeRestant: number;
  commissionsDues: number;
  commissionsPartenaires: number;
  savUrgents: number;
}

interface RecentDevis {
  id: string;
  numero: string;
  client_nom: string;
  total_ht: number;
  statut: string;
  is_vip: boolean;
}

interface Conteneur {
  id: string;
  reference: string;
  type: string;
  destination: string;
  date_depart: string;
  volume_utilise: number;
  volume_max: number;
  statut: string;
}

interface Commission {
  id: string;
  partenaire_code: string;
  partenaire_nom: string;
  montant: number;
  statut: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    devisTotal: 0,
    devisEnAttente: 0,
    devisVip: 0,
    devisStd: 0,
    caEncaisse: 0,
    soldeRestant: 0,
    commissionsDues: 0,
    commissionsPartenaires: 0,
    savUrgents: 0,
  });
  const [recentDevis, setRecentDevis] = useState<RecentDevis[]>([]);
  const [conteneurs, setConteneurs] = useState<Conteneur[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // V50-BIS Checkpoint D — diagnostic systematic-debugging :
  // Avant V50-BIS, loadData wrappait 5 queries Firestore dans un seul
  // try/catch global. Si UNE seule queries throw (collection inexistante,
  // index manquant pour `where in`, RBAC), tout le dashboard cassait avec
  // banniere "Erreur lors du chargement du tableau de bord".
  //
  // Apres V50-BIS : chaque section devient un helper independant,
  // toutes lancees en Promise.allSettled. Echec local = log console +
  // fallback (KPI "—", liste vide, demo data). Banniere globale n'apparait
  // que si TOUTES les sections echouent (ultime degraded mode).

  useEffect(() => {
    const loadData = async () => {
      // ──────────────────────────────────────────────────────────
      // Helpers granulaires — chacun gere sa propre partie de state
      // ──────────────────────────────────────────────────────────
      type QuotesPartial = {
        devisTotal: number; devisEnAttente: number; devisVip: number;
        caEncaisse: number; soldeRestant: number;
        recents: RecentDevis[];
      };
      const loadQuotesStats = async (): Promise<QuotesPartial> => {
        const allQuotesSnap = await getDocs(collection(db, 'quotes'));
        const allQuotes = allQuotesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

        const devisTotal = allQuotes.length;
        const devisEnAttente = allQuotes.filter((q) => q.statut === 'nouveau' || q.statut === 'envoye').length;
        const devisVip = allQuotes.filter((q) => q.is_vip || q.statut === 'vip_envoye').length;

        let caEncaisse = 0;
        allQuotes.forEach((q) => {
          if (q.acomptes && Array.isArray(q.acomptes)) {
            q.acomptes.forEach((a: any) => {
              if (a.encaisse === true) caEncaisse += (a.montant || 0);
            });
          }
        });

        const totalHtAll = allQuotes.reduce((sum, q) => sum + (q.total_ht || 0), 0);
        const soldeRestant = totalHtAll - caEncaisse;

        // 5 most recent devis sorted by createdAt
        const sorted = [...allQuotes].sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const tb = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return tb - ta;
        });
        return {
          devisTotal, devisEnAttente, devisVip,
          caEncaisse, soldeRestant,
          recents: sorted.slice(0, 5) as RecentDevis[],
        };
      };

      type CommissionsPartial = {
        commissionsDues: number;
        commissionsPartenaires: number;
        list: Commission[];
      };
      const loadCommissionsStats = async (): Promise<CommissionsPartial> => {
        const [commSnap, notesCommSnap] = await Promise.all([
          getDocs(collection(db, 'commissions')).catch(() => null),
          getDocs(collection(db, 'notes_commission')).catch(() => null),
        ]);
        let commissionsDues = 0;
        const partenaireSet = new Set<string>();
        const list: Commission[] = [];
        if (commSnap) {
          commSnap.docs.forEach((d) => {
            const data = d.data();
            if (data.statut === 'due') {
              commissionsDues += (data.montant || 0);
              if (data.partenaire_code) partenaireSet.add(data.partenaire_code);
              list.push({ id: d.id, ...data } as Commission);
            }
          });
        }
        if (notesCommSnap) {
          notesCommSnap.docs.forEach((d) => {
            const data = d.data();
            if (data.statut === 'due') {
              commissionsDues += (data.montant || 0);
              if (data.partenaire_code) partenaireSet.add(data.partenaire_code);
              list.push({ id: d.id, ...data } as Commission);
            }
          });
        }
        return { commissionsDues, commissionsPartenaires: partenaireSet.size, list };
      };

      const loadSavCount = async (): Promise<number> => {
        const savSnap = await getDocs(
          query(collection(db, 'sav'), where('statut', '==', 'nouveau'))
        );
        return savSnap.size;
      };

      const loadConteneurs = async (): Promise<Conteneur[]> => {
        const contQuery = query(
          collection(db, 'containers'),
          where('statut', 'in', ['préparation', 'chargé', 'parti']),
          limit(3)
        );
        const contSnap = await getDocs(contQuery);
        return contSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Conteneur[];
      };

      // ──────────────────────────────────────────────────────────
      // Promise.allSettled : echecs granulaires non bloquants
      // ──────────────────────────────────────────────────────────
      const [quotesRes, commissionsRes, savRes, contRes] = await Promise.allSettled([
        loadQuotesStats(),
        loadCommissionsStats(),
        loadSavCount(),
        loadConteneurs(),
      ]);

      // Quotes : section cle (CA, KPI principaux)
      let quotesPartial: QuotesPartial = {
        devisTotal: 0, devisEnAttente: 0, devisVip: 0,
        caEncaisse: 0, soldeRestant: 0, recents: [],
      };
      if (quotesRes.status === 'fulfilled') {
        quotesPartial = quotesRes.value;
        setRecentDevis(quotesRes.value.recents);
      } else {
        console.warn('[Dashboard] loadQuotesStats failed:', quotesRes.reason?.message);
      }

      let commissionsPartial: CommissionsPartial = {
        commissionsDues: 0, commissionsPartenaires: 0, list: [],
      };
      if (commissionsRes.status === 'fulfilled') {
        commissionsPartial = commissionsRes.value;
        setCommissions(commissionsRes.value.list.slice(0, 5));
      } else {
        console.warn('[Dashboard] loadCommissionsStats failed:', commissionsRes.reason?.message);
      }

      let savCount = 0;
      if (savRes.status === 'fulfilled') {
        savCount = savRes.value;
      } else {
        console.warn('[Dashboard] loadSavCount failed (collection sav inexistante ou rules ?):',
          savRes.reason?.message);
      }

      if (contRes.status === 'fulfilled') {
        setConteneurs(contRes.value);
      } else {
        console.warn('[Dashboard] loadConteneurs failed (collection containers ou index manquant ?):',
          contRes.reason?.message);
        setConteneurs([]);
      }

      setStats({
        devisTotal: quotesPartial.devisTotal,
        devisEnAttente: quotesPartial.devisEnAttente,
        devisVip: quotesPartial.devisVip,
        devisStd: quotesPartial.devisEnAttente - quotesPartial.devisVip,
        caEncaisse: quotesPartial.caEncaisse,
        soldeRestant: quotesPartial.soldeRestant,
        commissionsDues: commissionsPartial.commissionsDues,
        commissionsPartenaires: commissionsPartial.commissionsPartenaires,
        savUrgents: savCount,
      });

      // Banniere globale UNIQUEMENT si TOUTES les sections principales ont echoue.
      // (Mode degrade extreme — ex: pas de connexion BD du tout.)
      const allFailed =
        quotesRes.status === 'rejected' &&
        commissionsRes.status === 'rejected' &&
        savRes.status === 'rejected' &&
        contRes.status === 'rejected';
      if (allFailed) {
        setErrorMsg('Erreur lors du chargement du tableau de bord');
      }

      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  }

  return (
    <>
      {errorMsg && <div className="card" style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 20px', marginBottom: 16, borderLeft: '4px solid #EF4444' }}>{errorMsg}</div>}
      {/* KPI Grid */}
      <div className="kgrid">
        <Kpi
          label="Devis en attente"
          value={stats.devisEnAttente}
          sub={`${stats.devisVip} VIP · ${stats.devisStd} standard`}
        />
        <Kpi
          label="CA encaisse avr."
          value={`${stats.caEncaisse.toLocaleString('fr-FR')}€`}
          color="tl"
          sub="+12% vs mars"
        />
        <Kpi
          label="Commissions dues"
          value={`${stats.commissionsDues.toLocaleString('fr-FR')}€`}
          color="or"
          sub={`${stats.commissionsPartenaires} partenaires`}
        />
        <Kpi label="SAV urgents" value={stats.savUrgents} color="rd" sub="A traiter" />
      </div>

      {/* Two columns layout */}
      <div className="g2">
        {/* Left column */}
        <div>
          {/* Devis recents */}
          <Card
            title="Devis recents"
            actions={
              <Link href="/admin/devis">
                <Button variant="p">Voir tout</Button>
              </Link>
            }
          >
            <table className="admin-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Client</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentDevis.length === 0 ? (
                  <>
                    {/* Demo data if no real data */}
                    <tr className="cl">
                      <td>
                        <strong>D2604006</strong>
                      </td>
                      <td>Dupont MQ</td>
                      <td style={{ fontWeight: 700, color: 'var(--pu)' }}>14 200€</td>
                      <td>
                        <Pill variant="pu">VIP</Pill>
                      </td>
                      <td className="tda">
                        <Link href="/admin/devis/D2604006">
                          <IconButton icon={<EyeIcon />} tooltip="Ouvrir" variant="eye" />
                        </Link>
                      </td>
                    </tr>
                    <tr className="cl">
                      <td>
                        <strong>D2604007</strong>
                      </td>
                      <td>Martin GP</td>
                      <td style={{ fontWeight: 700 }}>18 400€</td>
                      <td>
                        <Pill variant="or">En attente</Pill>
                      </td>
                      <td className="tda">
                        <IconButton icon={<EyeIcon />} tooltip="Ouvrir" variant="eye" />
                      </td>
                    </tr>
                  </>
                ) : (
                  recentDevis.map((d) => (
                    <tr key={d.id} className="cl">
                      <td>
                        <strong>{d.numero}</strong>
                      </td>
                      <td>{d.client_nom || '—'}</td>
                      <td
                        style={{
                          fontWeight: 700,
                          color: d.is_vip ? 'var(--pu)' : 'inherit',
                        }}
                      >
                        {d.total_ht?.toLocaleString('fr-FR')}€
                      </td>
                      <td>
                        <Pill variant={d.is_vip ? 'pu' : d.statut === 'brouillon' ? 'or' : 'tl'}>
                          {d.is_vip ? 'VIP' : d.statut === 'brouillon' ? 'En attente' : 'Acompte'}
                        </Pill>
                      </td>
                      <td className="tda">
                        <Link href={`/admin/devis/${d.id}`}>
                          <IconButton icon={<EyeIcon />} tooltip="Ouvrir" variant="eye" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>

          {/* Conteneurs actifs */}
          <Card
            title="Conteneurs actifs"
            actions={
              <Link href="/admin/conteneurs">
                <Button variant="out">Gerer</Button>
              </Link>
            }
          >
            <div style={{ padding: 12 }}>
              {conteneurs.length === 0 ? (
                <>
                  {/* Demo container */}
                  <div style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 3,
                      }}
                    >
                      <strong style={{ fontSize: 12 }}>CTN-2604-001</strong>
                      <Pill variant="or">En prep.</Pill>
                    </div>
                    <div
                      style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 3 }}
                    >
                      40HC · MQ Fort de France · 23/04
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ flex: 1 }}>
                        <Progress value={48} max={67} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>48/67m³</span>
                    </div>
                  </div>
                </>
              ) : (
                conteneurs.map((c) => (
                  <div key={c.id} style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 3,
                      }}
                    >
                      <strong style={{ fontSize: 12 }}>{c.reference}</strong>
                      <Pill variant={c.statut === 'préparation' ? 'or' : 'tl'}>
                        {c.statut === 'préparation' ? 'En prep.' : c.statut}
                      </Pill>
                    </div>
                    <div
                      style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 3 }}
                    >
                      {c.type} · {c.destination} · {c.date_depart}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ flex: 1 }}>
                        <Progress value={c.volume_utilise} max={c.volume_max} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>
                        {c.volume_utilise}/{c.volume_max}m³
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div>
          {/* SAV urgents */}
          {stats.savUrgents > 0 && (
            <div className="sav-urg">
              <h3
                style={{
                  fontFamily: 'var(--fh)',
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 3,
                }}
              >
                🔧 {stats.savUrgents} SAV urgents
              </h3>
              <p style={{ fontSize: 11, opacity: 0.85 }}>
                Dupont MQ — MP-R22-001 · Carrera — ACC-GD-004
              </p>
              <Link href="/admin/sav">
                <button
                  className="btn r"
                  style={{ marginTop: 8 }}
                >
                  Traiter →
                </button>
              </Link>
            </div>
          )}

          {/* Commissions dues */}
          <Card
            title="Commissions dues"
            actions={
              <Link href="/admin/commissions">
                <Button variant="out">Voir tout</Button>
              </Link>
            }
          >
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Partenaire</th>
                  <th>Due</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {commissions.length === 0 ? (
                  <>
                    {/* Demo data */}
                    <tr>
                      <td>
                        <Pill variant="pu">JM</Pill> Jean-Marc
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--pu)' }}>3 160€</td>
                      <td>
                        <Pill variant="or">Due</Pill>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Pill variant="pu">TD</Pill> Thomas D.
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--pu)' }}>4 900€</td>
                      <td>
                        <Pill variant="or">Due</Pill>
                      </td>
                    </tr>
                  </>
                ) : (
                  commissions.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Pill variant="pu">{c.partenaire_code}</Pill> {c.partenaire_nom}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--pu)' }}>
                        {c.montant?.toLocaleString('fr-FR')}€
                      </td>
                      <td>
                        <Pill variant="or">Due</Pill>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </>
  );
}
