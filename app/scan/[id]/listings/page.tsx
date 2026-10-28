'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function ListingsPage() {
  const params = useParams<{ id: string }>()
  const [listings, setListings] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/listings', { method: 'POST' }).then((r) => r.json()).then((d) => setListings(d.listings ?? [])).catch(() => {})
  }, [])

  return (
    <main className="app-shell">
      <div className="content-section">
        <div className="section-heading"><div><p className="eyebrow">LISTINGS</p><h2>Your store</h2></div></div>
        <div className="scan-list">
          {listings.map((l: any) => (
            <div key={l.id} className="scan-row">
              <div className="scan-info"><strong>{l.name ?? l.title}</strong><span>KES {l.unitPriceKes ?? l.priceKes}</span></div>
            </div>
          ))}
        </div>
        <button className="button button-yellow" style={{ marginTop: 20, marginRight: 10 }} onClick={async () => { await fetch("/api/stores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shopId: "demo", listings }) }); window.location.href = "/store/demo" }}>Publish store</button>
        <Link href="/" className="button button-light" style={{ marginTop: 20 }}>Back home</Link>
      </div>
    </main>
  )
}
