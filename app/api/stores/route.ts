import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { setStoreListings } from '@/lib/store'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const shopId = body.shopId ?? 'demo'
  const listings = body.listings ?? []
  try {
    for (const l of listings) {
      const name = l.name ?? l.title ?? 'Item'
      const existing = await prisma.storeListing.findFirst({ where: { shopId, name } })
      const data = {
        shopId,
        scanId: l.scanId ?? null,
        name,
        unit: l.unit ?? 'units',
        category: l.category ?? 'general',
        quantity: l.quantity ?? 0,
        unitPriceKes: l.unitPriceKes ?? l.priceKes ?? 0,
        imageUrl: l.imageUrl ?? null,
      }
      if (existing) {
        await prisma.storeListing.update({ where: { id: existing.id }, data })
      } else {
        await prisma.storeListing.create({ data })
      }
    }
    return NextResponse.json({ ok: true, url: `/store/${shopId}` })
  } catch (e) {
    console.error(e)
    setStoreListings(shopId, listings)
    return NextResponse.json({ ok: true, url: `/store/${shopId}` })
  }
}
