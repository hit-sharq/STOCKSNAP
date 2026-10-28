'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function StorePage() {
  const params = useParams<{ shopId: string }>()
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/scans').then((r) => r.json()).then(async (d) => {
      const id = d.scans?.[0]?.id
      if (id) {
        const r2 = await fetch(`/api/runs/${id}`)
        const d2 = await r2.json()
        setItems(d2.items ?? [])
      }
    }).catch(() => {})
  }, [])

  return (
    <main className="app-shell">
      <div className="content-section">
        <div className="section-heading"><div><p className="eyebrow">STORE</p><h2>{params.shopId}</h2></div></div>
        <div className="scan-list">
          {items.map((item: any) => (
            <div key={item.id} className="scan-row">
              <div className="scan-info"><strong>{item.name}</strong><span>KES {item.unitPriceKes} · Grade {item.condition}</span></div>
              <button className="button button-yellow">Buy</button>
            </div>
          ))}
        </div>
        <Link href="/" className="button button-light" style={{ marginTop: 20 }}>Back home</Link>
      </div>
    </main>
  )
}
