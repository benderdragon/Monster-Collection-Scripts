function importCellContentAndFormulasOptimized() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let ui = SpreadsheetApp.getUi(); // Get the UI for alerts and prompts

  // --- Step 1: Prompt user for the JSON file name ---
  const fileNameResponse = ui.prompt(
    'Import JSON File',
    'Enter the name of the JSON file to import from Google Drive (e.g., "MySpreadsheet_content_and_formulas_2023-07-26T12-34-56Z.json"):',
    ui.ButtonSet.OK_CANCEL
  );

  // User clicked "Cancel" or closed the dialog
  if (fileNameResponse.getSelectedButton() !== ui.Button.OK) {
    Logger.log("Import cancelled by user.");
    ui.alert("Import Cancelled", "The import operation was cancelled.", ui.ButtonSet.OK);
    return;
  }

  const jsonFileName = fileNameResponse.getResponseText();
  if (!jsonFileName) {
    ui.alert("Error", "No file name entered. Import cancelled.", ui.ButtonSet.OK);
    return;
  }

  Logger.log(`Attempting to import from file: "${jsonFileName}"`);

  // --- Step 2: Find and read the JSON file ---
  let files;
  try {
    files = DriveApp.getFilesByName(jsonFileName);
  } catch (e) {
    Logger.log(`Error accessing DriveApp: ${e.message}`);
    ui.alert("Error", `Could not access Google Drive to find files. Please check permissions. Error: ${e.message}`, ui.ButtonSet.OK);
    return;
  }

  if (!files.hasNext()) {
    Logger.log(`File not found: "${jsonFileName}"`);
    ui.alert("File Not Found", `No file named "${jsonFileName}" was found in your Google Drive. Please ensure the name is exact and the file exists.`, ui.ButtonSet.OK);
    return;
  }

  const file = files.next();
  Logger.log(`Found file: "${file.getName()}" (ID: ${file.getId()})`);

  let fileContent;
  try {
    fileContent = file.getBlob().getDataAsString();
  } catch (e) {
    Logger.log(`Error reading file content: ${e.message}`);
    ui.alert("Error", `Could not read content from "${jsonFileName}". Error: ${e.message}`, ui.ButtonSet.OK);
    return;
  }

  // --- Step 3: Parse the JSON content ---
  let importedData;
  try {
    importedData = JSON.parse(fileContent);
    Logger.log("JSON content parsed successfully.");
  } catch (e) {
    Logger.log(`Error parsing JSON content: ${e.message}`);
    ui.alert("JSON Parse Error", `The content of "${jsonFileName}" is not valid JSON. Error: ${e.message}`, ui.ButtonSet.OK);
    return;
  }

  // --- Step 4: Prepare data for batch writing ---
  // This object will hold the 2D arrays for each sheet,
  // along with their max dimensions.
  const sheetsDataForSetValues = {};

  for (const sheetName in importedData) {
    if (Object.prototype.hasOwnProperty.call(importedData, sheetName)) {
      const sheetContent = importedData[sheetName];
      let maxRow = 0;
      let maxCol = 0;

      // First pass: Determine the maximum row and column needed for this sheet
      for (const a1Notation in sheetContent) {
        if (Object.prototype.hasOwnProperty.call(sheetContent, a1Notation)) {
          const { row, col } = parseA1(a1Notation); // row and col are 0-based
          if (row + 1 > maxRow) maxRow = row + 1;
          if (col + 1 > maxCol) maxCol = col + 1;
        }
      }

      // Initialize a 2D array with empty strings for the determined dimensions
      const valuesToSet = Array(maxRow).fill(0).map(() => Array(maxCol).fill(''));

      // Second pass: Populate the 2D array with the actual content
      for (const a1Notation in sheetContent) {
        if (Object.prototype.hasOwnProperty.call(sheetContent, a1Notation)) {
          const content = sheetContent[a1Notation];
          const { row, col } = parseA1(a1Notation); // row and col are 0-based
          if (row < maxRow && col < maxCol) { // Basic bounds check
            valuesToSet[row][col] = content;
          }
        }
      }
      sheetsDataForSetValues[sheetName] = { values: valuesToSet, maxRow: maxRow, maxCol: maxCol };
    }
  }

  // --- Step 5: Write data to Google Sheet using batch operations ---
  let sheetsProcessedCount = 0;
  let cellsImportedCount = 0;

  for (const sheetName in sheetsDataForSetValues) {
    if (Object.prototype.hasOwnProperty.call(sheetsDataForSetValues, sheetName)) {
      Logger.log(`Importing data to sheet: "${sheetName}"`);
      let targetSheet = spreadsheet.getSheetByName(sheetName);
      const { values, maxRow, maxCol } = sheetsDataForSetValues[sheetName];

      if (!targetSheet) {
        // Create the sheet if it doesn't exist
        try {
          targetSheet = spreadsheet.insertSheet(sheetName);
          Logger.log(`Created new sheet: "${sheetName}"`);
        } catch (e) {
          Logger.log(`Could not create sheet "${sheetName}". Error: ${e.message}`);
          ui.alert("Sheet Creation Error", `Could not create sheet "${sheetName}". Skipping this sheet. Error: ${e.message}`, ui.ButtonSet.OK);
          continue; // Skip to the next sheet
        }
      }

      // Clear existing content in the target range to ensure a clean import
      // This is optional but recommended to avoid leftover data if the new data is smaller.
      targetSheet.getRange(1, 1, targetSheet.getMaxRows(), targetSheet.getMaxColumns()).clearContent();
      // If you want to clear only the area where new data will be written:
      // targetSheet.getRange(1, 1, maxRow, maxCol).clearContent();


      if (maxRow > 0 && maxCol > 0) {
        try {
          // Resize sheet if necessary to accommodate data
          if (targetSheet.getMaxRows() < maxRow) {
            targetSheet.insertRowsAfter(targetSheet.getMaxRows(), maxRow - targetSheet.getMaxRows());
          }
          if (targetSheet.getMaxColumns() < maxCol) {
            targetSheet.insertColumnsAfter(targetSheet.getMaxColumns(), maxCol - targetSheet.getMaxColumns());
          }

          // Batch write all content for the sheet
          targetSheet.getRange(1, 1, maxRow, maxCol).setValues(values);
          cellsImportedCount += maxRow * maxCol; // Approximate count, counts empty cells too
          Logger.log(`Batch imported ${maxRow * maxCol} cells to sheet: "${sheetName}"`);
        } catch (e) {
          Logger.log(`Error during batch import for sheet "${sheetName}": ${e.message}`);
          ui.alert("Batch Write Error", `Could not write data to sheet "${sheetName}". Error: ${e.message}`, ui.ButtonSet.OK);
        }
      } else {
        Logger.log(`No content to import for sheet: "${sheetName}"`);
      }
      sheetsProcessedCount++;
    }
  }

  // --- Final Confirmation ---
  Logger.log(`Import complete! Processed ${sheetsProcessedCount} sheets and imported approximately ${cellsImportedCount} cells.`);
  ui.alert("Import Complete", `Successfully imported data from "${jsonFileName}".\n\nProcessed ${sheetsProcessedCount} sheets and imported approximately ${cellsImportedCount} cells.`, ui.ButtonSet.OK);
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