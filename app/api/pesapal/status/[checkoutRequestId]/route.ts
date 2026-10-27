import { NextResponse } from 'next/server'
import { pesapalStatuses } from '@/lib/pesapal'

export async function GET(_req: Request, { params }: { params: Promise<{ checkoutRequestId: string }> }) {
  const { checkoutRequestId } = await params
  const status = pesapalStatuses.get(checkoutRequestId) ?? 'pending'
  return NextResponse.json({ status })
}
