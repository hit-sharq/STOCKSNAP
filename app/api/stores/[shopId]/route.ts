import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params
  try {
    const listings = await prisma.storeListing.findMany({ where: { shopId }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ listings })
  } catch (e) {
    return NextResponse.json({ listings: [] })
  }
}
