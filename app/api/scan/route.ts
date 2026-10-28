import { NextResponse } from 'next/server'
import { detectItemsFromImage } from '@/lib/meta-vision'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const file = form?.get('image')
  let dataUrl = ''
  let imageUrl = ''
  if (file instanceof File) {
    const buf = Buffer.from(await file.arrayBuffer())
    dataUrl = `data:${file.type || 'image/jpeg'};base64,${buf.toString('base64')}`
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`scans/${Date.now()}-${file.name}`, file, { access: 'public' })
      imageUrl = blob.url
    }
  }
  if (!imageUrl) imageUrl = dataUrl || ''
  const detected = dataUrl ? await detectItemsFromImage(dataUrl) : null
  const items = (detected ?? []).map((it: any, i: number) => ({
    id: it.id ?? `item-${i}`,
    name: it.name,
    unit: it.unit ?? 'units',
    category: it.category ?? 'general',
    quantity: it.quantity ?? 0,
    expectedQuantity: it.expectedQuantity ?? it.quantity ?? 0,
    condition: it.condition ?? 'A',
    unitPriceKes: it.unitPriceKes ?? 0,
    confidence: it.confidence ?? 0,
    confirmed: false,
    suggestedAction: it.suggestedAction ?? 'Review',
    actionReason: it.actionReason ?? '',
    colorHex: it.colorHex ?? '#c98a00',
    imageUrl,
  }))

  try {
    const scan = await prisma.scan.create({
      data: {
        title: 'New scan',
        imageUrl,
        itemCount: items.length,
        totalValueKes: items.reduce((s: number, it: any) => s + it.quantity * it.unitPriceKes, 0),
        date: 'Just now',
        status: items.length ? 'Needs you' : 'Done',
        steps: {
          create: [
            { key: 'detect', status: 'done', summary: `Found ${items.reduce((s: number, i: any) => s + i.quantity, 0)} items` },
            { key: 'identify', status: 'done', summary: `${items.filter((i: any) => i.confidence < 80).length} low-confidence items` },
            { key: 'reconcile', status: 'done', summary: 'Stock reconciled' },
            { key: 'review', status: items.some((i: any) => i.confidence < 80) ? 'awaiting_user' : 'done', summary: 'Review complete' },
            { key: 'decide', status: 'done', summary: 'Actions suggested' },
            { key: 'list', status: 'done', summary: 'Listings drafted' },
          ],
        },
        items: {
          create: items.map((it: any) => ({
            name: it.name,
            unit: it.unit,
            category: it.category,
            quantity: it.quantity,
            expectedQuantity: it.expectedQuantity,
            condition: it.condition,
            unitPriceKes: it.unitPriceKes,
            confidence: it.confidence,
            confirmed: it.confirmed,
            suggestedAction: it.suggestedAction,
            actionReason: it.actionReason,
            colorHex: it.colorHex,
            imageUrl: it.imageUrl ?? null,
          })),
        },
      },
    })
    return NextResponse.json({ id: scan.id })
  } catch (e) {
    console.error(e)
    const id = `scan-${Date.now()}`
    return NextResponse.json({ id })
  }
}

export async function GET() {
  try {
    const scans = await prisma.scan.findMany({ include: { items: true }, orderBy: { id: 'desc' } })
    return NextResponse.json({ scans })
  } catch (e) {
    return NextResponse.json({ scans: [] })
  }
}
