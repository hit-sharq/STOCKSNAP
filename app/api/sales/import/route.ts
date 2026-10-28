import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  const scanId = (form?.get('scanId') as string) || ''
  let csv = ''
  if (file instanceof File) csv = await file.text()
  else {
    const body = await req.json().catch(() => ({}))
    csv = body.csv ?? ''
  }

  const lines = csv.trim().split(/\r?\n/).filter(Boolean)
  if (!lines.length) return NextResponse.json({ ok: false, error: 'empty' }, { status: 400 })

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const nameIdx = header.indexOf('name') >= 0 ? header.indexOf('name') : 0
  const qtyIdx = header.indexOf('quantity') >= 0 ? header.indexOf('quantity') : header.indexOf('sold') >= 0 ? header.indexOf('sold') : 1

  const targetScan = scanId
    ? await prisma.scan.findUnique({ where: { id: scanId }, include: { items: true } })
    : await prisma.scan.findFirst({ orderBy: { id: 'desc' }, include: { items: true } })

  let updated = 0
  for (const line of lines.slice(1)) {
    const cols = line.split(',').map((c) => c.trim())
    const name = cols[nameIdx]
    const sold = parseInt(cols[qtyIdx] || '0', 10)
    if (!name || !sold) continue
    await prisma.saleRecord.create({ data: { scanId: targetScan?.id ?? null, itemName: name, quantity: sold } })
    if (targetScan) {
      const item = targetScan.items.find((i: any) => i.name.toLowerCase() === name.toLowerCase())
      if (item) {
        await prisma.item.update({ where: { id: item.id }, data: { expectedQuantity: item.expectedQuantity + sold } })
        updated++
      }
    }
  }
  return NextResponse.json({ ok: true, updated, scanId: targetScan?.id })
}
