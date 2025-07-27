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

/**
 * Helper function to convert an A1 notation string (e.g., "A1", "C5", "AA10")
 * into a 0-based row and column index object { row: number, col: number }.
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
 * Helper function to check if a string is in ISO 8601 format.
 * This is a common format for dates when converted to JSON.
 * @param {string} str The string to check.
 * @returns {boolean} True if the string looks like an ISO date, false otherwise.
 */
function isIsoDateString(str) {
  if (typeof str !== 'string') return false;
  // A common ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
  // This regex is a basic check, more robust parsing might be needed for all variations.
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(str);
}

/**
 * Helper function to attempt parsing a value into a Date object if it's an ISO date string.
 * Otherwise, returns the original value.
 * @param {*} value The value to potentially parse.
 * @returns {*} A Date object if parsed, otherwise the original value.
 */
function tryParseDate(value) {
  if (isIsoDateString(value)) {
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
 * to a JSON file in Google Drive and optionally to a new sheet.
 *
 * This script is optimized to minimize API calls for better performance.
 */
function exportCellContentAndFormulasOptimized() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const allCellData = {}; // Will store both values and formulas
  const ui = SpreadsheetApp.getUi(); // Get the UI for alerts

  Logger.log("Starting export process...");

  spreadsheet.getSheets().forEach(sheet => {
    const sheetName = sheet.getName();
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();

    // Log progress for the current sheet
    Logger.log(`Processing sheet: "${sheetName}" (Last Row: ${lastRow}, Last Column: ${lastColumn})`);

    if (lastRow === 0 || lastColumn === 0) {
      // Skip empty sheets
      Logger.log(`Skipping empty sheet: "${sheetName}"`);
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

  // --- Option 1: Log to console (for quick inspection) ---
  // Logger.log("\n--- JSON Output Start ---");
  // Logger.log(jsonOutput);
  // Logger.log("--- JSON Output End ---\n");
  // ui.alert("Export Complete!", "Check your Apps Script logs (Ctrl+Enter or Cmd+Enter) for the JSON output.", ui.ButtonSet.OK);


  // --- Option 2: Save to a Google Drive file ---
  const fileName = `${spreadsheet.getName()}_content_and_formulas_${new Date().toISOString().replace(/:/g, '-')}.json`;
  try {
    DriveApp.createFile(fileName, jsonOutput, 'application/json');
    Logger.log(`Saved JSON file to Google Drive: '${fileName}'`);
    ui.alert("Export Complete!", `Content and formulas saved as '${fileName}' to your Google Drive.`, ui.ButtonSet.OK);
  } catch (e) {
    Logger.log(`Error saving file to Drive: ${e.message}`);
    ui.alert("Export Error", `Could not save file to Google Drive. Error: ${e.message}`, ui.ButtonSet.OK);
  }


  // --- Option 3: Create a new Sheet with cell content/formulas (as text) ---
  // try {
  //   const newSheet = spreadsheet.insertSheet('Content_Formulas_Extracted');
  //   newSheet.appendRow(['Sheet Name', 'Cell A1 Notation', 'Content/Formula']);

  //   for (const sheetName in allCellData) {
  //     if (Object.prototype.hasOwnProperty.call(allCellData, sheetName)) {
  //       for (const a1Notation in allCellData[sheetName]) {
  //         if (Object.prototype.hasOwnProperty.call(allCellData[sheetName], a1Notation)) {
  //           newSheet.appendRow([sheetName, a1Notation, allCellData[sheetName][a1Notation]]);
  //         }
  //       }
  //     }
  //   }
  //   Logger.log(`Exported content to new sheet: 'Content_Formulas_Extracted'`);
  //   ui.alert("Export Complete!", `Content and formulas also exported to a new sheet called 'Content_Formulas_Extracted'.`, ui.ButtonSet.OK);
  // } catch (e) {
  //   Logger.log(`Error exporting to new sheet: ${e.message}`);
  //   ui.alert("Export Error", `Could not export to a new sheet. Error: ${e.message}`, ui.ButtonSet.OK);
  // }

  Logger.log("Export process finished.");
}


/**
 * Imports cell content (values and formulas) into the active Google Spreadsheet
 * from a JSON file located in Google Drive.
 *
 * This script is optimized to use batch operations (setValues) for better performance.
 */
function importCellContentAndFormulasOptimized() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // Log start of the import process
  Logger.log('Import: Starting import process');

  // 1. Prompt user for JSON file name
  const fileNameResponse = ui.prompt(
    'Import JSON File',
    'Enter the name of the JSON file to import from Google Drive (e.g., "MySpreadsheet_content_and_formulas_2023-07-26T12-34-56Z.json"): ',
    ui.ButtonSet.OK_CANCEL
  );
  if (fileNameResponse.getSelectedButton() !== ui.Button.OK) {
    // User clicked "Cancel" or closed the dialog
    Logger.log('Import: User cancelled at file prompt');
    ui.alert("Import Cancelled", "The import operation was cancelled.", ui.ButtonSet.OK);
    return;
  }
  const jsonFileName = fileNameResponse.getResponseText();
  if (!jsonFileName) {
    Logger.log('Import: No file name entered');
    ui.alert("Error", "No file name entered. Import cancelled.", ui.ButtonSet.OK);
    return;
  }
  Logger.log(`Import: Loading JSON file '${jsonFileName}'`);

  // 2. Find and read the JSON file
  let file;
  try {
    const files = DriveApp.getFilesByName(jsonFileName);
    if (!files.hasNext()) throw new Error('File not found');
    file = files.next();
    Logger.log(`Import: Found file '${file.getName()}' (ID: ${file.getId()})`);
  } catch (e) {
    Logger.log(`Import: Error finding file - ${e.message}`);
    ui.alert("File Error", `Could not find or open "${jsonFileName}". Please ensure the name is exact.`, ui.ButtonSet.OK);
    return;
  }

  let importedData;
  try {
    importedData = JSON.parse(file.getBlob().getDataAsString());
    Logger.log('Import: JSON parsed successfully');
  } catch (e) {
    Logger.log(`Import: JSON parse error - ${e.message}`);
    ui.alert("JSON Parse Error", `The content of "${jsonFileName}" is not valid JSON.`, ui.ButtonSet.OK);
    return;
  }

  let sheetsProcessedCount = 0;
  const sheetNames = Object.keys(importedData);
  Logger.log(`Import: Sheets to process - ${sheetNames.join(', ')}`);

  // Loop through each sheet in the JSON
  for (const sheetName of sheetNames) {
    Logger.log(`Import: Processing sheet '${sheetName}'`);
    const sheetContent = importedData[sheetName];
    let targetSheet = spreadsheet.getSheetByName(sheetName);
    if (!targetSheet) {
      // Create the sheet if it doesn't exist
      targetSheet = spreadsheet.insertSheet(sheetName);
      Logger.log(`Import: Created new sheet '${sheetName}'`);
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
      Logger.log(`Import: No content found in sheet '${sheetName}', skipping.`);
      sheetsProcessedCount++;
      continue;
    }

    // Resize sheet if necessary to accommodate data before clearing
    if (targetSheet.getMaxRows() < maxRow) {
      targetSheet.insertRowsAfter(targetSheet.getMaxRows(), maxRow - targetSheet.getMaxRows());
      Logger.log(`Import: Inserted rows to reach ${maxRow}`);
    }
    if (targetSheet.getMaxColumns() < maxCol) {
      targetSheet.insertColumnsAfter(targetSheet.getMaxColumns(), maxCol - targetSheet.getMaxColumns());
      Logger.log(`Import: Inserted columns to reach ${maxCol}`);
    }

    // --- Phase 1: Clear Target Sheet & Import Formulas Only ---
    Logger.log(`Import: Phase 1 (Clear & Formulas) for '${sheetName}'`);
    targetSheet.getRange(1, 1, maxRow, maxCol).clearContent();

    const formulasToSet = Array(maxRow).fill(0).map(() => Array(maxCol).fill(''));
    for (const a1Notation in sheetContent) {
      const content = sheetContent[a1Notation];
      const { row, col } = parseA1(a1Notation);

      if (typeof content === 'string' && content.startsWith('=')) {
        formulasToSet[row][col] = content;
      }
    }
    targetSheet.getRange(1, 1, maxRow, maxCol).setFormulas(formulasToSet);
    Logger.log(`Import: Formulas written for '${sheetName}', waiting for spills...`);

    // Small delay to allow formulas to calculate and spill.
    Utilities.sleep(1000);

    // --- Phase 2: Read Current State & Conditionally Overlay Static Values ---
    Logger.log(`Import: Phase 2 (Capture spills & overlay values) for '${sheetName}'`);
    const currentRange = targetSheet.getRange(1, 1, maxRow, maxCol);
    const currentValues = currentRange.getValues();   // Contains spills and static values
    const currentFormulas = currentRange.getFormulas(); // Contains formula strings if cell is source

    // Step 2: Initialize finalValuesToSet
    //   - Pre-fill with existing formulas to preserve formula cells
    //   - Use empty string placeholders elsewhere
    const finalValuesToSet = currentFormulas.map((rowFormulas, r) =>
      rowFormulas.map((cellFormula, c) => (cellFormula !== '' ? cellFormula : ''))
    );

    // Step 3: Overlay JSON’s static contents
    //   - Loop through each JSON entry that is not a formula
    //   - Only write into cells that are empty (no formula, no spill, and no placeholder)
    for (const a1Notation in sheetContent) {
      const content = sheetContent[a1Notation];
      const { row, col } = parseA1(a1Notation);

      if (typeof content === 'string' && content.startsWith('=')) {
        continue; // Skip formulas
      }

      const processedContent = tryParseDate(content);

      // Only write static content if target cell is truly empty:
      //  - Not a formula cell
      //  - Not part of a spill (no computed value)
      //  - Not already filled in finalValuesToSet
      if (
        currentFormulas[row][col] === '' &&
        currentValues[row][col] === '' &&
        finalValuesToSet[row][col] === ''
      ) {
        finalValuesToSet[row][col] = processedContent;
      }
    }

    // Step 4: Batch write the combined grid
    //   - Preserves formulas/spills
    //   - Inserts only true static values
    currentRange.setValues(finalValuesToSet);
    Logger.log(`Import: Static values overlaid for '${sheetName}'`);

    sheetsProcessedCount++;
  }

  Logger.log(`Import: Complete. Processed ${sheetsProcessedCount} sheet(s).`);
  ui.alert(
    "Import Complete",
    `Successfully imported data from "${jsonFileName}". Processed ${sheetsProcessedCount} sheet(s).`,
    ui.ButtonSet.OK
  );
}


