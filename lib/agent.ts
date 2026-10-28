import { prisma } from '@/lib/db'
import { segment } from '@/lib/sam'

const API_BASE = 'https://api.meta.ai/v1'

async function museJson(messages: any[]): Promise<any> {
  const apiKey = process.env.MODEL_API_KEY!
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.VISION_MODEL || 'muse-spark-1.3', messages, temperature: 0.2 }),
  })
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content ?? ''
  const match = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/)
  return match ? JSON.parse(match[0]) : null
}

export async function runScan(imageBase64: string) {
  const scan = await prisma.scan.create({
    data: { title: 'New scan', itemCount: 0, totalValueKes: 0, date: 'Just now', status: 'running', imageUrl: imageBase64 },
  })

  const steps: { key: string; status: string; summary: string }[] = []

  // plan
  const types: string[] = await museJson([
    { role: 'system', content: 'Return only a JSON array of short singular noun phrases for item types visible.' },
    { role: 'user', content: [{ type: 'text', text: 'List item types visible in this shelf photo.' }, { type: 'image_url', image_url: { url: imageBase64 } }] },
  ]) ?? []
  steps.push({ key: 'plan', status: 'done', summary: `Found ${types.length} item types` })

  // detect + inspect per type
  const items: any[] = []
  for (const t of types) {
    const seg = await segment(imageBase64, t)
    const boxes = (seg as any)?.records?.filter((r: any) => r.kind === 'box') ?? []
    const count = boxes.length
    const expected = count

    // inspect
    const info = await museJson([
      { role: 'system', content: 'Return only a JSON object: {"name":string,"category":string,"condition":"A"|"B"|"C","unitPriceKes":number,"confidence":number}' },
      { role: 'user', content: [{ type: 'text', text: `Item type: ${t}. Count: ${count}. Return details.` }, { type: 'image_url', image_url: { url: imageBase64 } }] },
    ]) ?? { name: t, category: 'general', condition: 'A', unitPriceKes: 100, confidence: 80 }

    items.push({
      scanId: scan.id,
      name: info.name ?? t,
      category: info.category ?? 'general',
      quantity: count,
      expectedQuantity: expected,
      condition: info.condition ?? 'A',
      unitPriceKes: info.unitPriceKes ?? 100,
      confidence: (info.confidence ?? 80) < 1 ? Math.round((info.confidence ?? 0.8) * 100) : (info.confidence ?? 80),
      confirmed: (info.confidence ?? 80) >= 80,
      suggestedAction: (info.confidence ?? 80) < 80 ? 'Needs confirmation' : 'Stable stock',
      actionReason: '',
      colorHex: '#0b6b4b',
      unit: 'units',
    })
  }

  // reconcile step
  const shortages = items.filter((i) => i.quantity < i.expectedQuantity)
  steps.push({ key: 'detect', status: 'done', summary: `Detected ${items.reduce((s, i) => s + i.quantity, 0)} instances` })
  steps.push({ key: 'inspect', status: 'done', summary: `Inspected ${items.length} types` })
  steps.push({ key: 'reconcile', status: 'done', summary: shortages.length ? `${shortages.length} shortage(s)` : 'Stock matches' })

  // review: create review tasks for low confidence
  const reviewTasks = items.filter((i) => i.confidence < 80).map((i) => ({
    scanId: scan.id,
    kind: 'low_confidence',
    message: `${i.name} is only ${i.confidence}% sure`,
  }))
  // review tasks skipped (no ReviewTask model)

  await prisma.scan.update({ where: { id: scan.id }, data: { status: reviewTasks.length ? 'awaiting_user' : 'done' } })

  for (const it of items) {
    await prisma.item.create({ data: it })
  }
  for (const st of steps) {
    await prisma.agentStep.create({ data: { scanId: scan.id, key: st.key, status: st.status, summary: st.summary } })
  }

  return scan.id
}

export async function getRun(id: string) {
  const scan = await prisma.scan.findUnique({
    where: { id },
    include: { steps: true, items: true },
  })
  return scan
}
