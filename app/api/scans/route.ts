import { NextResponse } from 'next/server'
import { runScan } from '@/lib/agent'

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const file = form?.get('image')
  let dataUrl = ''
  if (file instanceof File) {
    const buf = Buffer.from(await file.arrayBuffer())
    dataUrl = `data:${file.type || 'image/jpeg'};base64,${buf.toString('base64')}`
  }
  const id = await runScan(dataUrl)
  return NextResponse.json({ id })
}
