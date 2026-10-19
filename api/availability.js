const AULAO_SLOTS = ['8h30–9h30', '9h30–10h30', '10h30–11h30', '11h30–12h30'];
const CAPACITY = 8;

function emptyAvailability() {
  return Object.fromEntries(AULAO_SLOTS.map((slot) => [slot, { booked: 0, remaining: CAPACITY, available: true }]));
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  response.setHeader('Cache-Control', 'no-store, max-age=0');
  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('SHEETS_WEBHOOK_URL não configurada.');
    return response.status(503).json({ error: 'A disponibilidade está sendo configurada.' });
  }

  try {
    const sheetsResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'availability', secret: process.env.SHEETS_WEBHOOK_SECRET || '' }),
      redirect: 'follow'
    });
    if (!sheetsResponse.ok) throw new Error(`Google Sheets respondeu ${sheetsResponse.status}`);

    const result = await sheetsResponse.json();
    if (result.ok === false || !result.slots) throw new Error(result.error || 'Resposta inválida da planilha.');
    return response.status(200).json({ ok: true, capacity: result.capacity || CAPACITY, slots: result.slots });
  } catch (error) {
    console.error('Falha ao consultar vagas no Google Sheets:', error.message);
    return response.status(502).json({ ok: false, capacity: CAPACITY, slots: emptyAvailability(), error: 'Não foi possível consultar as vagas.' });
  }
}
