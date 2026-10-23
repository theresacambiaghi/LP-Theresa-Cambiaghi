const REQUIRED_FIELDS = ['name', 'whatsapp', 'aulaoHorario'];
const AULAO_SLOTS = new Set(['8h–9h', '9h–10h', '10h–11h', '11h–12h']);

function clean(value, max = 250) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  let body;
  try {
    body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : request.body || {};
  } catch {
    return response.status(400).json({ error: 'Dados inválidos.' });
  }

  // Bots costumam preencher este campo invisível. Retornamos sucesso sem salvar.
  if (body.website) return response.status(200).json({ ok: true });

  const data = {
    name: clean(body.name, 100),
    whatsapp: clean(body.whatsapp, 24),
    aulaoHorario: clean(body.aulaoHorario, 30),
    submittedAt: new Date().toISOString(),
    source: 'Aulão 30/10 - LP Theresa Cambiaghi'
  };

  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = data[field];
    return Array.isArray(value) ? value.length === 0 : !value;
  });

  if (missing.length) return response.status(400).json({ error: 'Preencha todas as respostas obrigatórias.' });
  if (!AULAO_SLOTS.has(data.aulaoHorario)) return response.status(400).json({ error: 'Escolha um horário válido para o aulão.' });

  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('SHEETS_WEBHOOK_URL não configurada.');
    return response.status(503).json({ error: 'O formulário está sendo configurado.' });
  }

  try {
    const sheetsResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, secret: process.env.SHEETS_WEBHOOK_SECRET || '' }),
      redirect: 'follow'
    });

    if (!sheetsResponse.ok) throw new Error(`Google Sheets respondeu ${sheetsResponse.status}`);
    const result = await sheetsResponse.json().catch(() => ({ ok: true }));
    if (result.ok === false) {
      if (result.code === 'SLOT_FULL') return response.status(409).json({ error: result.error, code: result.code });
      throw new Error(result.error || 'Falha ao gravar na planilha.');
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Falha no envio para Google Sheets:', error.message);
    return response.status(502).json({ error: 'Não foi possível registrar sua resposta.' });
  }
}
