/**
 * @OnlyCurrentDoc
 *
 * This script provides functions to export and import spreadsheet data (values and formulas)
 * to and from a JSON file stored in Google Drive. This allows for backing up and restoring
 * a spreadsheet's state. The import process is optimized to handle array formulas and
 * preserve spilled results.
 */

/**
 * Helper function to convert a 1-based column number to its A1 letter representation.
 * E.g., 1 -> A, 2 -> B, 27 -> AA
 * @param {number} column The column number (1-indexed).
 * @returns {string} The A1 letter representation.
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

/**
 * Helper function to convert an A1 notation string (e.g., "A1", "C5", "AA10")
 * into a 0-based row and column index object { row: number, col: number }.
 * @param {string} a1Notation The cell's A1 notation.
 * @returns {{row: number, col: number}} An object with 0-indexed row and column.
 */
function parseA1(a1Notation) {
  const match = a1Notation.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid A1 notation: ${a1Notation}`);
  }
  const colLetters = match[1];
  const rowNum = parseInt(match[2], 10);

  let col = 0;
  for (let i = 0; i < colLetters.length; i++) {
    col = col * 26 + (colLetters.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }

  return { row: rowNum - 1, col: col - 1 }; // Convert to 0-based
}

/**
 * Helper function to check if a string is in a supported date format (ISO 8601 or MM/DD/YYYY).
 * @param {string} str The string to check.
 * @returns {boolean} True if the string matches a supported date format, false otherwise.
 */
function isSupportedDateString(str) {
  if (typeof str !== 'string') return false;
  // Regex to check for ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  // Regex to check for MM/DD/YYYY format.
  const usFormatRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  return isoRegex.test(str) || usFormatRegex.test(str);
}

/**
 * Helper function to attempt parsing a value into a Date object if it's a supported date string.
 * Otherwise, returns the original value.
 * @param {*} value The value to potentially parse.
 * @returns {*} A Date object if parsed, otherwise the original value.
 */
function tryParseDate(value) {
  if (isSupportedDateString(value)) {
    const date = new Date(value);
    // Check if the parsed date is valid (e.g., not "Invalid Date")
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return value;
}


/**
 * Exports all cell content (values and formulas) from the active Google Spreadsheet
 * to a JSON file in Google Drive. This script is optimized to minimize API calls.
 */
function exportCellContentAndFormulasOptimized() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const allCellData = {}; // Will store both values and formulas
  const ui = SpreadsheetApp.getUi(); // Get the UI for alerts

  console.log("Starting export process...");

  spreadsheet.getSheets().forEach(sheet => {
    const sheetName = sheet.getName();
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();

    console.log(`Processing sheet: "${sheetName}" (Last Row: ${lastRow}, Last Column: ${lastColumn})`);

    if (lastRow === 0 || lastColumn === 0) {
      console.log(`Skipping empty sheet: "${sheetName}"`);
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
          // Construct A1 notation manually
          const a1Notation = columnToLetter(c + 1) + String(r + 1);

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

  // --- Save to a Google Drive file ---
  const fileName = `${spreadsheet.getName()}_content_and_formulas_${new Date().toISOString().replace(/:/g, '-')}.json`;
  try {
    DriveApp.createFile(fileName, jsonOutput, 'application/json');
    console.log(`Saved JSON file to Google Drive: '${fileName}'`);
    ui.alert("Export Complete!", `Content and formulas saved as '${fileName}' to your Google Drive.`, ui.ButtonSet.OK);
  } catch (e) {
    console.log(`Error saving file to Drive: ${e.message}`);
    ui.alert("Export Error", `Could not save file to Google Drive. Error: ${e.message}`, ui.ButtonSet.OK);
  }

  console.log("Export process finished.");
}


/**
 * Imports cell content (values and formulas) into the active Google Spreadsheet
 * from a JSON file located in Google Drive. This script uses a two-phase approach
 * to correctly import formulas and their spilled results.
 */
function importCellContentAndFormulasOptimized() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  console.log('Import: Starting import process');

  // 1. Prompt user for JSON file name
  const fileNameResponse = ui.prompt(
    'Import JSON File',
    'Enter the name of the JSON file to import from Google Drive (e.g., "MySpreadsheet_content_and_formulas_...json"): ',
    ui.ButtonSet.OK_CANCEL
  );
  if (fileNameResponse.getSelectedButton() !== ui.Button.OK) {
    // User clicked "Cancel" or closed the dialog
    console.log('Import: User cancelled at file prompt');
    ui.alert("Import Cancelled", "The import operation was cancelled.", ui.ButtonSet.OK);
    return;
  }
  const jsonFileName = fileNameResponse.getResponseText();
  if (!jsonFileName) {
    console.log('Import: No file name entered');
    ui.alert("Error", "No file name entered. Import cancelled.", ui.ButtonSet.OK);
    return;
  }
  console.log(`Import: Loading JSON file '${jsonFileName}'`);

  // 2. Find and read the JSON file
  let file;
  try {
    const files = DriveApp.getFilesByName(jsonFileName);
    if (!files.hasNext()) throw new Error('File not found');
    file = files.next();
    console.log(`Import: Found file '${file.getName()}' (ID: ${file.getId()})`);
  } catch (e) {
    console.log(`Import: Error finding file - ${e.message}`);
    ui.alert("File Error", `Could not find or open "${jsonFileName}". Please ensure the name is exact.`, ui.ButtonSet.OK);
    return;
  }

  let importedData;
  try {
    importedData = JSON.parse(file.getBlob().getDataAsString());
    console.log('Import: JSON parsed successfully');
  } catch (e) {
    console.log(`Import: JSON parse error - ${e.message}`);
    ui.alert("JSON Parse Error", `The content of "${jsonFileName}" is not valid JSON.`, ui.ButtonSet.OK);
    return;
  }

  let sheetsProcessedCount = 0;
  const sheetNames = Object.keys(importedData);
  console.log(`Import: Sheets to process - ${sheetNames.join(', ')}`);

  // Loop through each sheet in the JSON
  for (const sheetName of sheetNames) {
    console.log(`Import: Processing sheet '${sheetName}'`);
    const sheetContent = importedData[sheetName];
    let targetSheet = spreadsheet.getSheetByName(sheetName);
    if (!targetSheet) {
      // Create the sheet if it doesn't exist
      targetSheet = spreadsheet.insertSheet(sheetName);
      console.log(`Import: Created new sheet '${sheetName}'`);
    }

    // Determine the maximum row and column needed for this sheet from imported data
    let maxRow = 0;
    let maxCol = 0;
    for (const a1Notation in sheetContent) {
      const { row, col } = parseA1(a1Notation);
      if (row + 1 > maxRow) maxRow = row + 1;
      if (col + 1 > maxCol) maxCol = col + 1;
    }

    // If no content in JSON for this sheet, skip it
    if (maxRow === 0 || maxCol === 0) {
      console.log(`Import: No content found in sheet '${sheetName}', skipping.`);
      sheetsProcessedCount++;
      continue;
    }

    // Resize sheet if necessary to accommodate data before clearing
    if (targetSheet.getMaxRows() < maxRow) {
      targetSheet.insertRowsAfter(targetSheet.getMaxRows(), maxRow - targetSheet.getMaxRows());
    }
    if (targetSheet.getMaxColumns() < maxCol) {
      targetSheet.insertColumnsAfter(targetSheet.getMaxColumns(), maxCol - targetSheet.getMaxColumns());
    }

    const targetRange = targetSheet.getRange(1, 1, maxRow, maxCol);
    
    // --- Phase 1: Clear Target Sheet & Import Formulas Only ---
    console.log(`Import: Phase 1 (Clear & Formulas) for '${sheetName}'`);
    targetRange.clearContent();

    const formulasToSet = Array(maxRow).fill(0).map(() => Array(maxCol).fill(''));
    for (const a1Notation in sheetContent) {
      const content = sheetContent[a1Notation];
      const { row, col } = parseA1(a1Notation);
      if (typeof content === 'string' && content.startsWith('=')) {
        formulasToSet[row][col] = content;
      }
    }
    targetRange.setFormulas(formulasToSet);
    console.log(`Import: Formulas written for '${sheetName}', waiting for spills...`);

    // Small delay to allow formulas to calculate and spill.
    Utilities.sleep(1000);

    // --- Phase 2: Read Current State & Conditionally Overlay Static Values ---
    console.log(`Import: Phase 2 (Capture spills & overlay values) for '${sheetName}'`);
    const currentValues = targetRange.getValues();   // Contains spills and static values
    const currentFormulas = targetRange.getFormulas(); // Contains formula strings if cell is source

    // Initialize a new grid with the formulas to preserve them.
    const finalValuesToSet = currentFormulas.map(row => [...row]);

    // Overlay the JSON’s static contents (non-formulas) onto the grid, but only
    // into cells that are truly empty (not a formula and not a spilled value).
    for (const a1Notation in sheetContent) {
      const content = sheetContent[a1Notation];
      const { row, col } = parseA1(a1Notation);

      // Skip formulas, as they are already in our grid.
      if (typeof content === 'string' && content.startsWith('=')) {
        continue;
      }
      
      // Only write static content if the target cell has no formula and no spilled value.
      if (currentFormulas[row][col] === '' && currentValues[row][col] === '') {
         finalValuesToSet[row][col] = tryParseDate(content);
      }
    }

    // Batch write the combined grid, preserving formulas/spills and inserting static values.
    targetRange.setValues(finalValuesToSet);
    console.log(`Import: Static values overlaid for '${sheetName}'`);
    sheetsProcessedCount++;
  }

  console.log(`Import: Complete. Processed ${sheetsProcessedCount} sheet(s).`);
  ui.alert(
    "Import Complete",
    `Successfully imported data from "${jsonFileName}". Processed ${sheetsProcessedCount} sheet(s).`,
    ui.ButtonSet.OK
  );
}