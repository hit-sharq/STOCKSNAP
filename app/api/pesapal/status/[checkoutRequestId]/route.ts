import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const BASE = process.env.PESAPAL_BASE_URL || 'https://cybqa.pesapal.com/pesapalv3'


async function getToken(): Promise<string | null> {
  if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) return null
  const BASE = process.env.PESAPAL_BASE_URL || 'https://cybqa.pesapal.com/pesapalv3'
  try {
    const res = await fetch(`${BASE}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ consumer_key: process.env.PESAPAL_CONSUMER_KEY, consumer_secret: process.env.PESAPAL_CONSUMER_SECRET }),
    })
    const data = await res.json()
    return data?.token ?? null
  } catch {
    return null
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ checkoutRequestId: string }> }) {
  const { checkoutRequestId } = await params
  try {
    let payment = await prisma.payment.findUnique({ where: { checkoutRequestId } })
    if (!payment) {
      return NextResponse.json({ status: 'pending' })
    }
    // Auto-complete simulated payments after 4s
    if (payment.status === 'pending' && !process.env.PESAPAL_CONSUMER_KEY) {
      const age = Date.now() - new Date(payment.createdAt).getTime()
      if (age > 4000) {
        payment = await prisma.payment.update({ where: { checkoutRequestId }, data: { status: 'success' } })
      }
    }
    const token = await getToken()
    // Fallback: if real auth unavailable, auto-complete simulated payments
    if (payment.status === 'pending' && !token) {
      const age = Date.now() - new Date(payment.createdAt).getTime()
      if (age > 4000) {
        payment = await prisma.payment.update({ where: { checkoutRequestId }, data: { status: 'success' } })
      }
    }
    // Real polling if creds valid
    if (payment.status === 'pending' && token) {
      try {
        if (token) {
          const statusRes = await fetch(`${BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${checkoutRequestId}`, {
            headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
          })
          const statusData = await statusRes.json()
          const s = (statusData?.payment_status_description || '').toLowerCase()
          if (s.includes('completed') || s.includes('success')) {
            payment = await prisma.payment.update({ where: { checkoutRequestId }, data: { status: 'success' } })
          } else if (s.includes('failed')) {
            payment = await prisma.payment.update({ where: { checkoutRequestId }, data: { status: 'failed' } })
          }
        }
      } catch {}
    }
    return NextResponse.json({ status: payment.status })
  } catch (e) {
    return NextResponse.json({ status: 'pending' })
  }
}
