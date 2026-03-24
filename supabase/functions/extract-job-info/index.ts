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
    const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)))
    const mimeType = file.type || 'application/octet-stream'

    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

    const prompt = `Extract the following from this document:
1. Street address (street number and name only, no city/town)
2. Town or city name
3. Leak number (the large work order or ticket number, often at the top of the form, or labeled "Leak #", "LIO #", or similar — NOT a survey job number)

Return ONLY valid JSON in exactly this format, nothing else:
{"street": "street address", "city": "town or city", "leak_number": "number"}

Combine street and city into the address like: "3401 Forest Ln, Garland"
If a field cannot be found, use null.`

    const isPDF = mimeType === 'application/pdf'

    const contentBlock = isPDF
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
      : { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [contentBlock as any, { type: 'text', text: prompt }],
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Could not parse extraction response')

    const parsed = JSON.parse(jsonMatch[0])
    const address = [parsed.street, parsed.city].filter(Boolean).join(', ') || null

    return new Response(
      JSON.stringify({ address, leak_number: parsed.leak_number ?? null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
