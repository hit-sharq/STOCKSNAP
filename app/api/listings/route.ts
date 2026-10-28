import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
    return NextResponse.json({ listings: [] })
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const scanId = url.searchParams.get('scanId')
  return POST(new Request(req.url, { method: 'POST', body: JSON.stringify({ scanId }) }))
}
