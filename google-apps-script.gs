/**
 * Cole este código em Extensões > Apps Script dentro da planilha.
 * Depois configure a propriedade WEBHOOK_SECRET e implante uma nova versão como Aplicativo da Web.
 */
const AULAO_CAPACITY = 8;
const AULAO_SLOTS = ['8h–9h', '9h–10h', '10h–11h', '11h–12h'];
const RESPONSE_HEADERS = [
  'Data e hora', 'Nome', 'WhatsApp', 'Horário do aulão'
];

function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || '{}');
    const expectedSecret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');

    if (expectedSecret && data.secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: 'Não autorizado.' });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName('Respostas') || spreadsheet.insertSheet('Respostas');
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const headers = ensureHeaders(sheet);

      if (data.action === 'availability') {
        return jsonResponse({ ok: true, capacity: AULAO_CAPACITY, slots: getAvailability(sheet, headers) });
      }

      const selectedSlot = String(data.aulaoHorario || '');
      if (AULAO_SLOTS.indexOf(selectedSlot) === -1) {
        return jsonResponse({ ok: false, code: 'SLOT_INVALID', error: 'Escolha um horário válido para o aulão.' });
      }

      const availability = getAvailability(sheet, headers);
      if (!availability[selectedSlot].available) {
        return jsonResponse({ ok: false, code: 'SLOT_FULL', error: 'Esse horário acabou de esgotar. Escolha outra turma para continuar.' });
      }

      const valuesByHeader = {
        'Data e hora': data.submittedAt || new Date().toISOString(),
        'Nome': data.name,
        'WhatsApp': data.whatsapp,
        'Horário do aulão': selectedSlot
      };

      sheet.appendRow(headers.map(function(header) { return safeCell(valuesByHeader[header]); }));
      availability[selectedSlot].booked += 1;
      availability[selectedSlot].remaining -= 1;
      availability[selectedSlot].available = availability[selectedSlot].remaining > 0;

      return jsonResponse({ ok: true, capacity: AULAO_CAPACITY, slot: selectedSlot, availability: availability[selectedSlot] });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, RESPONSE_HEADERS.length).setValues([RESPONSE_HEADERS]);
    sheet.getRange(1, 1, 1, RESPONSE_HEADERS.length).setFontWeight('bold').setBackground('#1c6d68').setFontColor('#f4e8da');
    sheet.setFrozenRows(1);
    return RESPONSE_HEADERS.slice();
  }

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  RESPONSE_HEADERS.forEach(function(header) {
    if (headers.indexOf(header) === -1) headers.push(header);
  });

  if (headers.length > lastColumn) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1c6d68').setFontColor('#f4e8da');
  }
  return headers;
}

function getAvailability(sheet, headers) {
  const result = {};
  AULAO_SLOTS.forEach(function(slot) {
    result[slot] = { booked: 0, remaining: AULAO_CAPACITY, available: true };
  });

  const slotColumn = headers.indexOf('Horário do aulão') + 1;
  const responseRows = Math.max(sheet.getLastRow() - 1, 0);
  if (!slotColumn || responseRows === 0) return result;

  sheet.getRange(2, slotColumn, responseRows, 1).getValues().forEach(function(row) {
    const slot = String(row[0] || '');
    if (result[slot]) result[slot].booked += 1;
  });

  AULAO_SLOTS.forEach(function(slot) {
    result[slot].remaining = Math.max(AULAO_CAPACITY - result[slot].booked, 0);
    result[slot].available = result[slot].remaining > 0;
  });
  return result;
}

// Impede que respostas iniciadas por =, +, - ou @ sejam interpretadas como fórmulas.
function safeCell(value) {
  const text = String(value || '');
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
