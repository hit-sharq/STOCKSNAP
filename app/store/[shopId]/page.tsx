'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function StorePage() {
  const params = useParams<{ shopId: string }>()
  const [items, setItems] = useState<any[]>([])
  const [status, setStatus] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/stores/${params.shopId}`).then((r) => r.json()).then((d) => setItems(d.listings ?? [])).catch(() => {})
  }, [params.shopId])

  const buy = async (item: any) => {
    const id = item.id
    setStatus((s) => ({ ...s, [id]: 'pending' }))
    const res = await fetch('/api/pesapal/stk-push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: '254700000000', amount: item.unitPriceKes }) })
    const data = await res.json()
    const cid = data.checkoutRequestId
    const poll = setInterval(async () => {
      const r = await fetch(`/api/pesapal/status/${cid}`)
      const d = await r.json()
      setStatus((s) => ({ ...s, [id]: d.status }))
      if (d.status !== 'pending') clearInterval(poll)
    }, 1500)
  }

  return (
    <main className="app-shell">
      <div className="content-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">STOREFRONT</p>
            <h2>{params.shopId}</h2>
          </div>
          <span className="count-note">{items.length} products</span>
        </div>

        {items.length === 0 ? (
          <div className="scan-list" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)' }}>No products published yet. Scan stock and publish your first listing.</p>
            <Link href="/" className="button button-yellow" style={{ marginTop: 16 }}>Start a scan</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {items.map((item: any) => (
              <article key={item.id} className="product-card" style={{ gridTemplateColumns: '1fr', alignItems: 'stretch' }}>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="product-img" src={item.imageUrl} alt={item.name} style={{ width: '100%', height: 180 }} />
                ) : (
                  <div className="product-img-placeholder" style={{ width: '100%', height: 180, fontSize: 48 }}>
                    {(item.name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <strong style={{ fontSize: 18 }}>{item.name}</strong>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>{item.category} · {item.quantity} {item.unit} in stock</span>
                  <span style={{ font: '900 22px Space Grotesk, sans-serif', background: 'linear-gradient(135deg,var(--sun),var(--green))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                    KES {item.unitPriceKes}
                  </span>
                </div>
                <button className="button button-yellow" style={{ width: '100%' }} onClick={() => buy(item)} disabled={status[item.id] === 'pending'}>
                  {status[item.id] === 'success' ? 'Paid ✓' : status[item.id] === 'pending' ? 'Processing...' : 'Buy now'}
                </button>
              </article>
            ))}
          </div>
        )}

        <Link href="/" className="button button-light" style={{ marginTop: 24 }}>Back home</Link>
      </div>
    </main>
  )
}
