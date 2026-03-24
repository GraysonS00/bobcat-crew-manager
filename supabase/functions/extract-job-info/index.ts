import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const bytes = await file.arrayBuffer()
    const uint8 = new Uint8Array(bytes)
    let binary = ''
    const chunk = 8192
    for (let i = 0; i < uint8.length; i += chunk) {
      binary += String.fromCharCode(...uint8.subarray(i, i + chunk))
    }
    const base64 = btoa(binary)
    const mimeType = file.type || 'application/octet-stream'

    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

    const prompt = `This document may contain one or more job sheets. For EACH job sheet found, extract:
1. Street address (street number and name only, no city/town)
2. Town or city name
3. Leak number (the large work order or ticket number, often at the top of the form, or labeled "Leak #", "LIO #", or similar — NOT a survey job number)

Return ONLY a valid JSON array, one entry per job sheet, nothing else:
[{"street": "street address", "city": "town or city", "leak_number": "number"}]

If only one job sheet, still return an array with one entry.
If a field cannot be found for a sheet, use null for that field.`

    const isPDF = mimeType === 'application/pdf'

    const contentBlock = isPDF
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
      : { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [contentBlock as any, { type: 'text', text: prompt }],
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Could not parse extraction response')

    const parsed: Array<{ street?: string; city?: string; leak_number?: string }> = JSON.parse(jsonMatch[0])

    const jobs = parsed.map(item => ({
      address: item.street && item.city ? `${item.street} - ${item.city}, TX` : (item.street || item.city || null),
      leak_number: item.leak_number ?? null,
    }))

    return new Response(
      JSON.stringify({ jobs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err?.message || (typeof err === 'string' ? err : JSON.stringify(err)) || 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
