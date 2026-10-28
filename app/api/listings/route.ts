import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getScan, getScans } from '@/lib/store'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const scanId = body?.scanId
  try {
    const scan = scanId
      ? await prisma.scan.findUnique({ where: { id: scanId }, include: { items: true } })
      : await prisma.scan.findFirst({ orderBy: { id: 'desc' }, include: { items: true } })
    const listings = (scan?.items ?? []).map((it: any) => ({
      id: it.id,
      name: it.name,
      unit: it.unit,
      category: it.category,
      quantity: it.quantity,
      unitPriceKes: it.unitPriceKes,
      imageUrl: it.imageUrl ?? scan?.imageUrl ?? null,
      scanId: scan?.id,
    }))
    return NextResponse.json({ listings, scanId: scan?.id })
  } catch (e) {
    const s = scanId ? getScan(scanId) : (getScans()[0] ?? null)
    const items = (s as any)?.items ?? []
    const listings = items.map((it: any, i: number) => ({
      id: it.id ?? `item-${i}`,
      name: it.name,
      unit: it.unit ?? 'units',
      category: it.category ?? 'general',
      quantity: it.quantity ?? 0,
      unitPriceKes: it.unitPriceKes ?? 0,
      imageUrl: it.imageUrl ?? (s as any)?.imageUrl ?? null,
      scanId: (s as any)?.id,
    }))
    return NextResponse.json({ listings, scanId: (s as any)?.id })
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const scanId = url.searchParams.get('scanId')
  return POST(new Request(req.url, { method: 'POST', body: JSON.stringify({ scanId }) }))
}
