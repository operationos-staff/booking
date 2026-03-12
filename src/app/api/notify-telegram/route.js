export async function POST(req) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return Response.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 200 })
  }

  const { message, chatId } = await req.json()
  if (!chatId || !message) {
    return Response.json({ ok: false, error: 'Missing message or chatId' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    })
    const data = await res.json()
    return Response.json({ ok: data.ok, error: data.description })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
