'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const money = (v: number) => `KES ${v.toLocaleString('en-KE')}`

export default function ScanPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [data, setData] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    fetch(`/api/scan/${id}`).then((r) => r.json()).then((d) => {
      setData(d)
      setItems(d.items ?? [])
    }).catch(() => {})
  }, [id])

  const persist = async (next: any[]) => {
    setItems(next)
    await fetch(`/api/scan/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: next }) })
  }

  const updateQty = (itemId: string, quantity: number) => persist(items.map((it) => it.id === itemId ? { ...it, quantity } : it))
  const confirm = (itemId: string) => persist(items.map((it) => it.id === itemId ? { ...it, confirmed: true } : it))

  const unconfirmed = items.filter((i) => !i.confirmed).length

  return (
    <main className="app-shell">
      <div className="content-section">
        <div className="section-heading"><div><p className="eyebrow">SCAN {id}</p><h2>Stock ledger</h2></div></div>
        {items.map((item: any) => (
          <div key={item.id} className="ledger-row">
            <span className="item-bar" style={{ background: item.colorHex }} />
            <div className="ledger-name"><strong>{item.name}</strong><span>{item.confidence}% sure · Grade {item.condition}</span></div>
            <div className="ledger-price"><strong>{money(item.unitPriceKes)}</strong></div>
            <div className="quantity">
              <button onClick={() => updateQty(item.id, Math.max(0, item.quantity - 1))}>−</button>
              <strong>{item.quantity}</strong>
              <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
            </div>
            {!item.confirmed ? <button className="review-button" onClick={() => confirm(item.id)}>Looks right</button> : <span className={item.quantity === item.expectedQuantity ? 'match' : 'short'}>{item.quantity === item.expectedQuantity ? 'Matches records' : `${Math.abs(item.expectedQuantity - item.quantity)} short`}</span>}
          </div>
        ))}
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <Link href={`/scan/${id}/listings`} className={`button button-yellow ${unconfirmed ? 'disabled' : ''}`} aria-disabled={unconfirmed > 0}>Create listings</Link>
          <Link href="/" className="button button-light">Back home</Link>
        </div>
      </div>
    </main>
  )
}
