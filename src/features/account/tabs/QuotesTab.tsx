import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { generateQuotePDF } from '@/features/pdf/templates/quote-pdf'

interface QuoteProduct {
  name: string
  quantity: number
  prixHT: number
  total: number
}

interface Quote {
  id: string
  reference: string
  date: string
  status: 'pending' | 'accepted' | 'refused' | 'paid'
  total: number
  products: QuoteProduct[]
  destination?: string
  shippingCost?: number
  notes?: string
  client?: {
    name: string
    email: string
    phone: string
    address: string
  }
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-orange-100 text-orange-700' },
  accepted: { label: 'Accepté', className: 'bg-green-100 text-green-700' },
  refused: { label: 'Refusé', className: 'bg-red-100 text-red-700' },
  paid: { label: 'Payé', className: 'bg-blue-100 text-blue-700' },
}

export default function QuotesTab() {
  const { user } = useAuth()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchQuotes = async () => {
      setLoading(true)
      try {
        const q = query(
          collection(db, 'quotes'),
          where('user_id', '==', user.uid),
          orderBy('date', 'desc')
        )
        const snapshot = await getDocs(q)
        const results = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Quote[]
        setQuotes(results)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }

    fetchQuotes()
  }, [user])

  const handleDownloadPDF = (quote: Quote) => {
    const pdf = generateQuotePDF({
      reference: quote.reference,
      date: quote.date,
      client: quote.client || { name: '', email: '', phone: '', address: '' },
      products: quote.products,
      destination: quote.destination || '',
      shippingCost: quote.shippingCost || 0,
      notes: quote.notes,
    })
    pdf.save(`devis-${quote.reference}.pdf`)
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Chargement des devis...</div>
  }

  if (quotes.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Aucun devis pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Mes Devis</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-sm font-medium text-gray-500">Référence</th>
              <th className="pb-3 text-sm font-medium text-gray-500">Date</th>
              <th className="pb-3 text-sm font-medium text-gray-500">Statut</th>
              <th className="pb-3 text-sm font-medium text-gray-500 text-right">Total</th>
              <th className="pb-3 text-sm font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => {
              const status = statusConfig[quote.status] || statusConfig.pending
              const isExpanded = expandedId === quote.id

              return (
                <tbody key={quote.id}>
                  <tr
                    className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(quote.id)}
                  >
                    <td className="py-3 text-sm font-medium text-gray-900">{quote.reference}</td>
                    <td className="py-3 text-sm text-gray-600">{quote.date}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-900 text-right font-medium">
                      {quote.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadPDF(quote)
                        }}
                        className="text-sm text-navy-600 hover:text-navy-800 font-medium"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="pb-4 pt-2 px-4 bg-gray-50">
                        <div className="text-sm">
                          <h4 className="font-medium text-gray-700 mb-2">Détail des produits</h4>
                          <table className="w-full">
                            <thead>
                              <tr className="text-xs text-gray-500">
                                <th className="text-left pb-1">Produit</th>
                                <th className="text-right pb-1">Qté</th>
                                <th className="text-right pb-1">Prix HT</th>
                                <th className="text-right pb-1">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {quote.products.map((p, i) => (
                                <tr key={i} className="border-t border-gray-200">
                                  <td className="py-1 text-gray-900">{p.name}</td>
                                  <td className="py-1 text-gray-600 text-right">{p.quantity}</td>
                                  <td className="py-1 text-gray-600 text-right">
                                    {p.prixHT.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                  </td>
                                  <td className="py-1 text-gray-900 text-right font-medium">
                                    {p.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {quote.notes && (
                            <p className="mt-2 text-gray-500 italic">Note : {quote.notes}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
