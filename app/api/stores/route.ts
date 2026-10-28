import { NextResponse } from 'next/server'
import { setStoreListings } from '@/lib/store'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const shopId = body.shopId ?? 'demo'
  setStoreListings(shopId, body.listings ?? [])
  return NextResponse.json({ ok: true, url: `/store/${shopId}` })
}
