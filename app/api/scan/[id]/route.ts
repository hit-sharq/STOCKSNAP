import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getScan, getItems, setItems } from '@/lib/store'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const scan = await prisma.scan.findUnique({ where: { id }, include: { items: true, steps: true } })
    if (scan) return NextResponse.json({ id, scan, items: scan.items, steps: scan.steps })
  } catch {}
  const s = getScan(id)
  const items = getItems(id)
  return NextResponse.json({ id, scan: s, items })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  try {
    if (Array.isArray(body.items)) {
      for (const it of body.items) {
        if (!it?.id) continue
        await prisma.item.update({
          where: { id: it.id },
          data: {
            quantity: it.quantity ?? undefined,
            confirmed: it.confirmed ?? undefined,
            condition: it.condition ?? undefined,
            unitPriceKes: it.unitPriceKes ?? undefined,
            name: it.name ?? undefined,
          },
        })
      }
    }
    const scan = await prisma.scan.findUnique({ where: { id }, include: { items: true } })
    return NextResponse.json({ ok: true, items: scan?.items ?? [] })
  } catch (e) {
    if (Array.isArray(body.items)) {
      const current = getItems(id)
      const next = current.map((ci: any) => {
        const upd = body.items.find((u: any) => u.id === ci.id)
        return upd ? { ...ci, ...upd } : ci
      })
      setItems(id, next)
      return NextResponse.json({ ok: true, items: next })
    }
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
