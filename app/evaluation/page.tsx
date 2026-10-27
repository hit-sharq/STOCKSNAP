'use client'

import Link from 'next/link'

export default function EvaluationPage() {
  return (
    <main className="app-shell">
      <div className="content-section">
        <div className="section-heading"><div><p className="eyebrow">INSIGHTS</p><h2>Evaluation</h2></div></div>
        <p>Model performance and accuracy will appear here.</p>
        <Link href="/" className="button button-light" style={{ marginTop: 20 }}>Back home</Link>
      </div>
    </main>
  )
}
