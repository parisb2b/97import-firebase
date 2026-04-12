import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { SortControl } from '../../components/SortControl';
import { generateFactureAcompte, generateFactureFinale, downloadPDF } from '../../lib/pdf-generator';

interface Invoice {
  id: string;
  numero: string;
  type: string;
  quote_id: string;
  montant: number;
  pdf_url: string;
  createdAt: any;
}

export default function Factures() {
  const { t } = useI18n();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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

  const handleDownloadPDF = async (inv: Invoice) => {
    try {
      // Fetch the quote data
      const quoteSnap = await getDoc(doc(db, 'quotes', inv.quote_id));
      if (!quoteSnap.exists()) {
        alert('Devis associé introuvable');
        return;
      }
      const quoteData = quoteSnap.data();

      // Generate PDF based on invoice type
      const pdfDoc = inv.type === 'acompte'
        ? generateFactureAcompte(quoteData, { montant: inv.montant, numero: inv.numero, createdAt: inv.createdAt }, emetteurData)
        : generateFactureFinale(quoteData, inv.numero, emetteurData);

      downloadPDF(pdfDoc, `${inv.numero}.pdf`);
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      alert('Erreur lors de la génération du PDF');
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);
    const loadInvoices = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'invoices'),
          orderBy('createdAt', sortOrder)
        );
        const snap = await getDocs(q);
        setInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice)));
      } catch (err) {
        console.error('Error loading invoices:', err);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };
    loadInvoices();
    return () => clearTimeout(timeout);
  }, [sortOrder]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.factures')}</h1>
        <SortControl value={sortOrder} onChange={setSortOrder} />
      </div>

      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Aucune facture
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-salmon-light">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Numéro</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Devis lié</th>
                <th className="text-right px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">PDF</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{inv.numero}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        inv.type === 'acompte'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {inv.type === 'acompte' ? 'Acompte' : 'Facture finale'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{inv.quote_id}</td>
                  <td className="px-4 py-3 text-right">
                    {inv.montant?.toLocaleString('fr-FR')} €
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDownloadPDF(inv)}
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
