'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="app-shell">
      <div className="content-section">
        <div className="section-heading"><div><p className="eyebrow">ABOUT</p><h2>StockSnap</h2></div></div>
        <p>An AI agent for small traders in Kenya.</p>
        <Link href="/" className="button button-light" style={{ marginTop: 20 }}>Back home</Link>
      </div>
    </main>
  )
}
