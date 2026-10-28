'use client'

import { motion } from 'framer-motion'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Camera, ChevronRight, CircleHelp, FileUp, Menu, Plus, ScanLine, ShoppingBag, Store, X } from 'lucide-react'
import { ShelfScene } from '@/components/shelf-scene'

const money = (value: number) => `KES ${value.toLocaleString('en-KE')}`

function StatusChip({ status }: { status: string }) {
  return <span className={`status status-${status.toLowerCase().replace(' ', '-')}`}><span className="status-dot" />{status}</span>
}

function Quantity({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return <div className="quantity" aria-label={`Quantity ${value}`}><button onClick={() => onChange?.(Math.max(0, value - 1))} aria-label="Decrease quantity">−</button><strong>{value}</strong><button onClick={() => onChange?.(value + 1)} aria-label="Increase quantity">+</button></div>
}

export default function Page() {
  const [items, setItems] = useState<any[]>([])
  const [recentScans, setRecentScans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [salesOpen, setSalesOpen] = useState(false)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitPriceKes, 0)
  const unconfirmed = items.filter((item) => !item.confirmed).length
  const missing = items.find((item) => item.quantity < item.expectedQuantity)
  const updateQuantity = (id: string, quantity: number) => setItems((current) => current.map((item) => item.id === id ? { ...item, quantity } : item))
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/scan')
        const data = await res.json()
        if (!active) return
        setRecentScans(data.scans ?? [])
        const id = data.scans?.[0]?.id
        if (id) {
          const r2 = await fetch(`/api/scan/${id}`)
          const d2 = await r2.json()
          if (active) setItems(d2.items ?? [])
        }
      } catch {}
      if (active) setLoading(false)
    })()
    return () => { active = false }
  }, [])
  const confirm = (id: string) => setItems((current) => current.map((item) => item.id === id ? { ...item, confirmed: true } : item))
  const handleFile = async (file?: File | null) => { if (!file) return; const form = new FormData(); form.append('image', file); const res = await fetch('/api/scan', { method: 'POST', body: form }); const data = await res.json(); window.location.href = `/scan/${data.id}` }

  return <main className="app-shell">
    <motion.section className="hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="hero-copy"><p className="eyebrow">LUMYN TECHNOLOGIES</p><h1>Snap your stock.<br /><em>Let the agent</em> run your shop.</h1><p className="hero-sub">One photo gives you a count, a grade and a price for every item.</p><div className="hero-actions"><label className="button button-dark"><Camera data-icon="inline-start" /> Take photo<input type="file" accept="image/*" capture="environment" onChange={(e) => handleFile(e.target.files?.[0])} /></label><label className="button button-light"><FileUp data-icon="inline-start" /> Upload from gallery<input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} /></label></div><p className="helper"><CircleHelp data-icon="inline-start" /> Photos are deleted after 7 days</p></div>
      <div className="hero-art"><div className="tape">AI STOCK TAKE<br /><span>NO GUESSWORK</span></div><div className="scene-frame"><ShelfScene /><div className="scan-line" /></div><div className="hero-sticker">COUNT<br /><strong>· PRICE ·</strong><br />SELL</div></div>
    </motion.section>

    <section className="content-section" id="scans"><div className="section-heading"><div><p className="eyebrow">YOUR SHOP</p><h2>Recent scans</h2></div><button className="text-button" onClick={() => setSalesOpen(true)}>Add your sales records <Plus data-icon="inline-end" /></button></div><div className="scan-list">{recentScans.map((scan) => <Link href={`/scan/${scan.id}`} className="scan-row" key={scan.id}><div className="scan-thumb"><ScanLine /></div><div className="scan-info"><strong>{scan.title}</strong><span>{scan.itemCount} items · {money(scan.totalValueKes)}</span></div><time>{scan.date}</time><StatusChip status={scan.status} /><ChevronRight className="row-arrow" /></Link>)}</div></section>

    <section className="run-section" id="about"><div className="run-copy"><p className="eyebrow">YOUR NEXT STOCK TAKE</p><h2>One shelf.<br /><em>Seven answers.</em></h2><p>The agent counts what is there, checks what should be there, then helps you decide what to sell.</p><Link href={recentScans[0] ? `/scan/${recentScans[0].id}` : "/"} className="button button-yellow">Open latest scan <ArrowRight data-icon="inline-end" /></Link></div><div className="run-steps">{['Find every item', 'Grade its condition', 'Check sales records', 'Draft your listings'].map((step, index) => <div className="run-step" key={step}><span>0{index + 1}</span><strong>{step}</strong><ChevronRight /></div>)}</div></section>

    <section className="ledger-section"><div className="section-heading"><div><p className="eyebrow">LATEST RESULT · 2 MIN AGO</p><h2>Stock ledger</h2></div><span className="count-note">{totalItems} items counted</span></div><div className="ledger-layout"><div className="ledger-photo"><ShelfScene /><div className="photo-label">FRONT SHELF · 96% MATCH</div></div><div className="ledger"><div className="insight"><div className="insight-icon">!</div><div><strong>{missing ? `${missing.expectedQuantity - missing.quantity} bags of ${missing.name.toLowerCase()} are missing.` : 'Your shelf matches your records.'}</strong><p>Counted {missing?.quantity ?? totalItems} on the shelf. Your sales records say {missing?.expectedQuantity ?? totalItems} should be there.</p></div></div>{items.map((item) => <article className={`ledger-row ${!item.confirmed ? 'needs-review' : ''}`} key={item.id}><span className="item-bar" style={{ background: item.colorHex }} /><div className="ledger-name"><strong>{item.name}</strong><span>{item.confidence < 80 ? `Only ${item.confidence}% sure` : `${item.confidence}% sure`} · Grade {item.condition}</span></div><div className="ledger-price"><strong>{money(item.unitPriceKes)}</strong><span>per {item.unit}</span></div><Quantity value={item.quantity} onChange={(value) => updateQuantity(item.id, value)} />{!item.confirmed ? <button className="review-button" onClick={() => confirm(item.id)}>Looks right</button> : <span className={item.quantity === item.expectedQuantity ? 'match' : 'short'}>{item.quantity === item.expectedQuantity ? 'Matches records' : `${Math.abs(item.expectedQuantity - item.quantity)} short`}</span>}</article>)}</div></div></section>

    <div className="bottom-bar"><span><strong>{totalItems} items counted</strong><small>Total value</small></span><strong className="bottom-total">{money(totalValue)}</strong><Link href={recentScans[0] ? `/scan/${recentScans[0].id}/listings` : "/"} className={`button button-yellow ${unconfirmed ? 'disabled' : ''}`} aria-disabled={unconfirmed > 0}>Create listings <ArrowRight data-icon="inline-end" /></Link></div>
    {salesOpen && <div className="modal-backdrop" role="presentation" onClick={() => setSalesOpen(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="sales-title" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setSalesOpen(false)} aria-label="Close"><X /></button><p className="eyebrow">KEEP COUNTS HONEST</p><h2 id="sales-title">Add your sales records</h2><p>Upload a CSV from your till to help the agent spot missing stock.</p><div className="upload-box"><FileUp /><strong>Drop your CSV here</strong><span>or choose a file from your phone</span><input type="file" accept=".csv,text/csv" onChange={async (e) => { const f=e.target.files?.[0]; if(!f) return; const fd=new FormData(); fd.append('file',f); if(recentScans[0]?.id) fd.append('scanId', recentScans[0].id); await fetch('/api/sales/import',{method:'POST',body:fd}); setSalesOpen(false) }} /></div><button className="text-button">Download template <ArrowRight data-icon="inline-end" /></button></div></div>}
  </main>
}
