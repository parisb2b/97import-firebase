import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { SortControl } from '../../components/SortControl';
import { generateNoteCommission, downloadPDF } from '../../lib/pdf-generator';

interface Commission {
  id: string;
  numero: string;
  partenaire_id: string;
  partenaire_nom: string;
  partenaire_code?: string;
  total_commission: number;
  statut: string;
  lignes?: any[];
  createdAt: any;
}

export default function NotesCommission() {
  const { t } = useI18n();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [emetteurData, setEmetteurData] = useState<any>(null);

  // Load emetteur data
  useEffect(() => {
    const fetchEmetteur = async () => {
      try {
        const snap = await getDoc(doc(db, 'admin_params', 'emetteur'));
        if (snap.exists()) setEmetteurData(snap.data());
      } catch (e) {
        console.error('Erreur chargement émetteur:', e);
      }
    };
    fetchEmetteur();
  }, []);

  const handleDownloadPDF = (commission: Commission) => {
    const pdfDoc = generateNoteCommission(commission, emetteurData);
    downloadPDF(pdfDoc, `${commission.numero}.pdf`);
  };

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);
    const load = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'commissions'),
          orderBy('createdAt', sortOrder)
        );
        const snap = await getDocs(q);
        setCommissions(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as Commission))
        );
      } catch (err) {
        console.error('Error loading commissions:', err);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };
    load();
    return () => clearTimeout(timeout);
  }, [sortOrder]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.commissions')}</h1>
        <SortControl value={sortOrder} onChange={setSortOrder} />
      </div>

      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : commissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Aucune note de commission
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-salmon-light">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Numéro</th>
                <th className="text-left px-4 py-3 font-medium">Partenaire</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-right px-4 py-3 font-medium">Commission</th>
                <th className="px-4 py-3 font-medium">PDF</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-navy">{c.numero}</td>
                  <td className="px-4 py-3">{c.partenaire_nom}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        c.statut === 'payée'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {c.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-purple-600">
                    {c.total_commission?.toLocaleString('fr-FR')} €
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDownloadPDF(c)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      title="Télécharger PDF"
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
