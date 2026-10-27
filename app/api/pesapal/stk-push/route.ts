import { NextResponse } from 'next/server'
import { pesapalStatuses } from '@/lib/pesapal'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const id = `pesapal_${Date.now()}`
  pesapalStatuses.set(id, 'pending')
  setTimeout(() => pesapalStatuses.set(id, 'success'), 4000)
  return NextResponse.json({ checkoutRequestId: id, phone: body.phone, amount: body.amount })
}
