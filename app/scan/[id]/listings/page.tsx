'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function ListingsPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [listings, setListings] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scanId: id }) })
      .then((r) => r.json()).then((d) => setListings(d.listings ?? [])).catch(() => {})
  }, [id])

  return (
    <main className="app-shell">
      <div className="content-section">
        <div className="section-heading"><div><p className="eyebrow">LISTINGS</p><h2>Your store</h2></div></div>
        <div className="scan-list">
          {listings.map((l: any) => (
            <div key={l.id} className="scan-row">
              <div className="scan-info"><strong>{l.name}</strong><span>KES {l.unitPriceKes} · {l.quantity} {l.unit}</span></div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button className="button button-yellow" onClick={async () => { await fetch("/api/stores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shopId: "demo", listings }) }); window.location.href = "/store/demo" }}>Publish store</button>
          <Link href={`/scan/${id}`} className="button button-light">Back to scan</Link>
        </div>
      </div>
    </main>
  )
}
