const IOS = "iOS"
const ANDROID = "android"

const KEY_COL_NAME = "Key"
const HEADER_INDEX = 0


for (header of SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getDataRange().offset(0, 0, 1).getValues()[0]) {
    const iosFun = camelize(`${IOS} ${header}`)
    const androidFun = camelize(`${ANDROID} ${header}`)
    this[iosFun] = function() {
      const copy = (' ' + header).slice(1);
      return function () {
        exportIos(copy)
      }
    }()
    this[androidFun] = function() {
      const copy = (' ' + header).slice(1);
      return function () {
        exportAndroid(copy)
      }
    }()
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  const headers = sheet.getDataRange().offset(0, 0, 1).getValues()[0];
  const menu = ui.createMenu('Localization')
  for(let header of headers) {
    const iosFun = camelize(`${IOS} ${header}`)
    const androidFun = camelize(`${ANDROID} ${header}`)

    menu.addItem(`${IOS} ${header}`, iosFun)
    .addItem(`${ANDROID} ${header}`, androidFun)
    .addSeparator()

  }
  menu.addToUi()
}

function getColByName(colName, row) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const col = data[row].indexOf(colName);
  if (col != -1) {
    const colData = data.map(function(values, index) { return values[col]});
    colData.shift()
    return colData
  }
}

function exportIos(header) {
  const keys = getColByName(KEY_COL_NAME, HEADER_INDEX)
  const values = getColByName(header, HEADER_INDEX)

  let enumString = "// MARK: - Localizable enum\n\nenum Localizable {\n\n"
  let strings = "// MARK: - Strings\n\n"
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = values[i]
    enumString += `\tstatic let ${key} = "${key}"\n\n`
    strings += `"${key}" = "{value}";\n`

  }
   enumString += "}\n\n"
   displayContent(enumString.concat(strings), header)
}

function exportAndroid(header) {
  const keys = getColByName(KEY_COL_NAME, HEADER_INDEX)
  const values = getColByName(header, HEADER_INDEX)

  let exportedString = '<?xml version="1.0" encoding="UTF-8"?>\n<resources>\n'
  for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const value = values[i]
      exportedString += `\t<string name="${key}">${escapeXml(value)}</string>\n`
  }

  exportedString += "</resources>";
  displayContent(exportedString, header)
}

// Open a modal with a textBox and a copy to clipboard button
function displayContent(content, header) {
  var modal = HtmlService.createHtmlOutput().setWidth(800).setHeight(800);
  const textArea = `<textarea rows="10" cols="80" id="text-0">${content}</textarea><br>`;
  const p = `
    <button onclick="myFunction()">Copy text</button>
    <script>
    function myFunction() {
      var copyText = document.getElementById("text-0");
      copyText.select();
      copyText.setSelectionRange(0, 99999); /* For mobile devices */
      /* Copy the text inside the text field */
      document.execCommand("copy");
    }
    </script>
  `
  modal.append(textArea)
  modal.append(p)
  SpreadsheetApp.getUi().showModalDialog(modal, `Localized ${header}`);
}

//Utils

function escapeXml(unsafe) {
    return unsafe.replace(/['"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}
