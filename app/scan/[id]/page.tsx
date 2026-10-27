'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function ScanPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/scan/${id}`).then((r) => r.json()).then(setData).catch(() => {})
  }, [id])

  return (
    <main className="app-shell">
      <div className="content-section">
        <div className="section-heading"><div><p className="eyebrow">SCAN {id}</p><h2>Stock ledger</h2></div></div>
        {data?.items?.map((item: any) => (
          <div key={item.id} className="ledger-row">
            <span className="item-bar" style={{ background: item.colorHex }} />
            <div className="ledger-name"><strong>{item.name}</strong><span>{item.confidence}% sure · Grade {item.condition}</span></div>
            <div className="ledger-price"><strong>KES {item.unitPriceKes}</strong></div>
          </div>
        ))}
        <Link href="/" className="button button-light" style={{ marginTop: 20 }}>Back home</Link>
      </div>
    </main>
  )
}
