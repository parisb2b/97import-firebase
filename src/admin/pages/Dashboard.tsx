import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
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
  devisEnAttente: number;
  devisVip: number;
  devisStd: number;
  caEncaisse: number;
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
    devisEnAttente: 7,
    devisVip: 3,
    devisStd: 4,
    caEncaisse: 34200,
    commissionsDues: 8320,
    commissionsPartenaires: 3,
    savUrgents: 2,
  });
  const [recentDevis, setRecentDevis] = useState<RecentDevis[]>([]);
  const [conteneurs, setConteneurs] = useState<Conteneur[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load recent devis
        const devisQuery = query(
          collection(db, 'quotes'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const devisSnap = await getDocs(devisQuery);
        const devisData = devisSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as RecentDevis[];
        setRecentDevis(devisData);

        // Load active containers
        const contQuery = query(
          collection(db, 'containers'),
          where('statut', 'in', ['préparation', 'chargé', 'parti']),
          limit(3)
        );
        const contSnap = await getDocs(contQuery);
        const contData = contSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Conteneur[];
        setConteneurs(contData);

        // Load pending commissions
        const commQuery = query(
          collection(db, 'notes_commission'),
          where('statut', '==', 'due'),
          limit(5)
        );
        const commSnap = await getDocs(commQuery);
        const commData = commSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Commission[];
        setCommissions(commData);

        // Update stats from actual data
        const devisEnAttenteSnap = await getDocs(
          query(collection(db, 'quotes'), where('statut', 'in', ['brouillon', 'envoye']))
        );
        const savUrgentsSnap = await getDocs(
          query(collection(db, 'sav'), where('statut', '==', 'nouveau'))
        );

        setStats((s) => ({
          ...s,
          devisEnAttente: devisEnAttenteSnap.size || s.devisEnAttente,
          savUrgents: savUrgentsSnap.size || s.savUrgents,
        }));
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  }

  return (
    <>
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
