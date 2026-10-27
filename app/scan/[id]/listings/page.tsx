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
        <Link href="/" className="button button-light" style={{ marginTop: 20 }}>Back home</Link>
      </div>
    </main>
  )
}
