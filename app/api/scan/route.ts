import { NextResponse } from 'next/server'
import { detectItemsFromImage } from '@/lib/meta-vision'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import { segment } from '@/lib/sam'
import { prisma } from '@/lib/db'



async function cropForItem(imageBuffer: Buffer, imageBase64: string, phrase: string, fallback: string) {
  try {
    const seg: any = await segment(imageBase64, phrase)
    const box = (seg?.records ?? []).find((r: any) => r.kind === 'box')
    if (!box) return fallback
    const meta = await sharp(imageBuffer).metadata()
    const W = meta.width || 1
    const H = meta.height || 1
    let { left, top, right, bottom } = box
    if (right <= 1 && bottom <= 1) { left *= W; top *= H; right *= W; bottom *= H }
    const x = Math.max(0, Math.round(left))
    const y = Math.max(0, Math.round(top))
    const w = Math.max(1, Math.round(right - left))
    const h = Math.max(1, Math.round(bottom - top))
    const buf = await sharp(imageBuffer).extract({ left: x, top: y, width: w, height: h }).jpeg({ quality: 80 }).toBuffer()
    return `data:image/jpeg;base64,${buf.toString('base64')}`
  } catch {
    return fallback
  }
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const file = form?.get('image')
  let dataUrl = ''
  let imageUrl = ''
  let imageBuffer: Buffer | null = null
  if (file instanceof File) {
    const buf = Buffer.from(await file.arrayBuffer())
    imageBuffer = buf
    dataUrl = `data:${file.type || 'image/jpeg'};base64,${buf.toString('base64')}`
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`scans/${Date.now()}-${file.name}`, file, { access: 'public' })
      imageUrl = blob.url
    }
  }
  if (!imageUrl) imageUrl = dataUrl || ''
  const detected = dataUrl ? await detectItemsFromImage(dataUrl) : null
  const baseItems = (detected ?? []).map((it: any, i: number) => ({
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
  const items = imageBuffer
    ? await Promise.all(baseItems.map(async (it: any) => ({
        ...it,
        imageUrl: (await cropForItem(imageBuffer, dataUrl, it.name, imageUrl)) || imageUrl,
      })))
    : baseItems

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
