function exportCellContentAndFormulasOptimized() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const allCellData = {}; // Will store both values and formulas

  spreadsheet.getSheets().forEach(sheet => {
    const sheetName = sheet.getName();
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();

    if (lastRow === 0 || lastColumn === 0) {
      // Skip empty sheets
      return;
    }

    const range = sheet.getRange(1, 1, lastRow, lastColumn);
    const values = range.getValues();     // 2D array of displayed values
    const formulas = range.getFormulas(); // 2D array of formula strings (empty string if no formula)

    const sheetData = {};
    for (let r = 0; r < values.length; r++) {
      for (let c = 0; c < values[r].length; c++) {
        const value = values[r][c];
        const formula = formulas[r][c];

        // Only process if there's any content (value or formula)
        if (value !== "" || formula !== "") {
          // Construct A1 notation manually: convert column index (0-based) to letter (A, B, C...)
          // and append row index (1-based).
          const a1Notation = columnToLetter(c + 1) + (r + 1);

          if (formula) { // If there's a formula, store the formula string
            sheetData[a1Notation] = formula;
          } else { // Otherwise, store the displayed value
            sheetData[a1Notation] = value;
          }
        }
      }
    }
    allCellData[sheetName] = sheetData;
  });

  // Convert to JSON string
  const jsonOutput = JSON.stringify(allCellData, null, 2); // null, 2 for pretty printing

  // --- Option 2: Save to a Google Drive file ---
  const fileName = `${spreadsheet.getName()}_content_and_formulas_${new Date().toISOString().replace(/:/g, '-')}.json`;
  // Using the correct string literal for JSON MIME type
  DriveApp.createFile(fileName, jsonOutput, 'application/json');
  Browser.msgBox("Cell Content & Formulas Extracted!", `Content and formulas saved as '${fileName}' to your Google Drive.`, Browser.Buttons.OK);
}

/**
 * Helper function to convert a 1-based column number to its A1 letter representation.
 * E.g., 1 -> A, 2 -> B, 27 -> AA
 */
function columnToLetter(column) {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}