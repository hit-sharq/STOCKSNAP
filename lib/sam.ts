import { parseImageStream } from '@meta-sam/parser'

const API_BASE = 'https://api.meta.ai/v1'

async function* readSSE(res: Response) {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') return
        try { yield JSON.parse(data) } catch {}
      }
    }
  }
}

export async function segment(imageBase64: string, phrase: string) {
  const apiKey = process.env.MODEL_API_KEY
  if (!apiKey) throw new Error('MODEL_API_KEY not set')

  const dataUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`

  const res = await fetch(`${API_BASE}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      model: 'sam-3.1',
      input: [
        {
          type: 'message',
          role: 'user',
          content: [
            { type: 'input_text', text: phrase },
            { type: 'input_image', image_url: dataUrl },
          ],
        },
      ],
      stream: true,
      metadata: { include_confidence: 'true' },
    }),
  })

  if (!res.ok) throw new Error(`SAM API error ${res.status}: ${await res.text()}`)

  const stream = parseImageStream(readSSE(res))
  for await (const _ of stream) {
    // consume
  }
  return await stream.finalResult
}
