import { NextResponse } from 'next/server'
import { getStoreListings } from '@/lib/store'

export async function GET(_req: Request, { params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params
  return NextResponse.json({ listings: getStoreListings(shopId) })
}
