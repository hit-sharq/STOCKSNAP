import { segment } from '../lib/sam'

async function plan(imageBase64: string): Promise<string[]> {
  const apiKey = process.env.MODEL_API_KEY!
  const res = await fetch('https://api.meta.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'muse-spark-1.3',
      messages: [
        { role: 'user', content: [{ type: 'text', text: 'List the item types visible in this shelf photo as a JSON array of short singular noun phrases.' }, { type: 'image_url', image_url: { url: imageBase64 } }] },
      ],
      temperature: 0.2,
    }),
  })
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content ?? '[]'
  const match = text.match(/\[[\s\S]*\]/)
  console.log('FULL:', JSON.stringify(data).slice(0,1000))
  return match ? JSON.parse(match[0]) : []
}

async function main() {
  try { const fs0 = await import('fs'); const lines = fs0.readFileSync('.env','utf8').split('\n'); for (const l of lines){const [k,v]=l.split('='); if(k&&v) process.env[k.trim()]=v.trim()} } catch {}
  const imgPath = process.argv[2]
  if (!imgPath) { console.error('Usage: m1 <image>'); process.exit(1) }
  const fs = await import('fs')
  const buf = fs.readFileSync(imgPath)
  const b64 = `data:image/jpeg;base64,${buf.toString('base64')}`

  console.log('Planning...')
  const types = await plan(b64)
  console.log('Item types:', types)

  for (const t of types) {
    console.log(`\nSegmenting: ${t}`)
    const result = await segment(b64, t)
    const records = (result as any)?.records ?? []
    const boxes = records.filter((r: any) => r.kind === 'box')
    console.log('Instances:', boxes.length)
    for (const b of boxes) {
      console.log('  box:', b.left, b.top, b.right, b.bottom, 'conf:', b.confidence)
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })