/**
 * Cole este código em Extensões > Apps Script dentro da planilha.
 * Depois configure a propriedade WEBHOOK_SECRET e implante como Aplicativo da Web.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const expectedSecret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');

    if (expectedSecret && data.secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: 'Não autorizado.' });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName('Respostas') || spreadsheet.insertSheet('Respostas');
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          'Data e hora', 'Nome', 'WhatsApp', 'Horários', 'Frequência',
          'Preferência', 'Experiências', 'Interesse', 'Mensagem', 'Origem'
        ]);
        sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#173f31').setFontColor('#ffffff');
        sheet.setFrozenRows(1);
      }

      sheet.appendRow([
        safeCell(data.submittedAt || new Date().toISOString()),
        safeCell(data.name),
        safeCell(data.whatsapp),
        safeCell(Array.isArray(data.horarios) ? data.horarios.join(', ') : ''),
        safeCell(data.frequencia),
        safeCell(data.preferencia),
        safeCell(data.experiencias),
        safeCell(data.interesse),
        safeCell(data.mensagem),
        safeCell(data.source)
      ]);
    } finally {
      lock.releaseLock();
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
}

// Impede que respostas iniciadas por =, +, - ou @ sejam interpretadas como fórmulas.
function safeCell(value) {
  const text = String(value || '');
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
