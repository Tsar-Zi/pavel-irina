/**
 * Приём анкет гостей в Google Таблицу.
 * Инструкция — в README.md, раздел «Анкета гостя».
 *
 * Скрипт нужно создать из самой таблицы: Расширения → Apps Script.
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    var cols = (data._labels || []).map(function (l) { return { id: l.id, label: l.label }; });
    var headers = ["Время отправки"].concat(cols.map(function (c) { return c.label; }));

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var row = [new Date()].concat(cols.map(function (c) { return data[c.id] || ""; }));
    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
