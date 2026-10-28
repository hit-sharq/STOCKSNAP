import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const BASE = process.env.PESAPAL_BASE_URL || 'https://cybqa.pesapal.com/pesapalv3'

async function getToken(): Promise<string | null> {
  const key = process.env.PESAPAL_CONSUMER_KEY
  const secret = process.env.PESAPAL_CONSUMER_SECRET
  if (!key || !secret) return null
  try {
    const res = await fetch(`${BASE}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ consumer_key: key, consumer_secret: secret }),
    })
    const data = await res.json()
    return data?.token ?? null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const phone = body.phone ?? ''
  const amount = Number(body.amount ?? 0)
  const simulatedId = `pesapal_${Date.now()}`

  let checkoutRequestId = simulatedId
  let token: string | null = null
  try {
    token = await getToken()
    if (token) {
      const ipnId = process.env.PESAPAL_IPN_ID
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const orderRes = await fetch(`${BASE}/api/Transactions/SubmitOrderRequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: simulatedId,
          currency: 'KES',
          amount,
          description: 'StockSnap purchase',
          callback_url: `${appUrl}/api/pesapal/status/${simulatedId}`,
          notification_id: ipnId,
          billing_address: { phone_number: phone, email_address: 'buyer@example.com', country_code: 'KE', first_name: 'Buyer' },
        }),
      })
      const orderData = await orderRes.json()
      checkoutRequestId = orderData?.order_tracking_id ?? simulatedId
    }
  } catch {}

  const real = !!token
  try {
    await prisma.payment.create({
      data: { checkoutRequestId, phone, amount: Math.round(amount), status: 'pending' },
    })
  } catch {}

  if (!real) {
    setTimeout(async () => {
      try { await prisma.payment.update({ where: { checkoutRequestId }, data: { status: 'success' } }) } catch {}
    }, 4000)
  }

  return NextResponse.json({ checkoutRequestId, phone, amount })
}
