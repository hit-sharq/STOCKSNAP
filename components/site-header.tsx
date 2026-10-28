import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="topbar">
      <Link href="/" className="wordmark">STOCKSNAP<span>.</span></Link>
      <nav className="nav-links" aria-label="Main navigation">
        <Link href="/">Home</Link>
        <Link href="/">Scan</Link>
        <Link href="/store/demo">View shop <span aria-hidden>→</span></Link>
      </nav>
    </header>
  )
}
