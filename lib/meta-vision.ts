const API_BASE = 'https://api.meta.ai/v1'

export async function detectItemsFromImage(dataUrl: string) {
  const apiKey = process.env.MODEL_API_KEY || process.env.META_API_KEY
  if (!apiKey) return null
  const prompt = 'Analyze this shelf photo. Return ONLY a JSON array of items: name, category, quantity (int), condition ("A"|"B"|"C"), unitPriceKes (int), confidence (0-100), colorHex (hex).'
  try {
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.VISION_MODEL || 'muse-spark-1.2',
        messages: [
          { role: 'system', content: 'You output only valid JSON arrays.' },
          { role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: dataUrl } }] },
        ],
        temperature: 0.2,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content ?? ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch {
    return null
  }
}
