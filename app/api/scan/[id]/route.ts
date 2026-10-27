import { NextResponse } from 'next/server'
import { getScan, getItems } from '@/lib/store'
import { prisma } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (process.env.DATABASE_URL) {
    try {
      const scan = await prisma.scan.findUnique({ where: { id }, include: { items: true } })
      if (scan) return NextResponse.json({ id, scan, items: scan.items })
    } catch {}
  }
  const s = getScan(id)
  const items = getItems(id)
  return NextResponse.json({ id, scan: s, items })
}
