"use strict";

/**
 * @OnlyCurrentDoc
 *
 * This script provides functions to import spreadsheet data (values and formulas)
 * from a JSON file located in Google Drive. This script uses a two-phase approach
 * to correctly import formulas and their spilled results.
 */

/**
 * @typedef {object} SheetDimensions
 * @property {number} maxRow Maximum row number needed
 * @property {number} maxCol Maximum column number needed
 */

/**
 * @typedef {object} ImportSheetConfig
 * @property {GoogleAppsScript.Spreadsheet.Range} targetRange The range to import into
 * @property {object} sheetContent The JSON content for this sheet
 * @property {string} sheetName Name of sheet for logging
 */

/* global parseA1 -- used in calculateSheetDimensions_() and importFromJson() */
/* global tryParseDate -- used in importStaticValuesPhase_() */

/**
 * Prompts user for JSON filename and handles the response.
 * @param {GoogleAppsScript.Base.Ui} ui The spreadsheet UI object.
 * @returns {{fileName: string, cancelled: boolean}} Result of user prompt.
 */
function promptForFileName_(ui) {
  const fileNameResponse = ui.prompt(
    "Import JSON File",
    'Enter the name of the JSON file to import from Google Drive (e.g., "MySpreadsheet_content_and_formulas_...json"): ',
    ui.ButtonSet.OK_CANCEL
  );

  if (fileNameResponse.getSelectedButton() !== ui.Button.OK) {
    console.log("Import: User cancelled at file prompt");
    return { fileName: "", cancelled: true };
  }

  const jsonFileName = fileNameResponse.getResponseText();
  if (!jsonFileName) {
    console.log("Import: No file name entered");
    return { fileName: "", cancelled: true };
  }

  return { fileName: jsonFileName, cancelled: false };
}

/**
 * Finds and loads JSON file from Google Drive.
 * @param {string} fileName The name of the JSON file to load.
 * @returns {{data: object, success: boolean, error?: string}} Result of file loading operation.
 */
function loadJsonFile_(fileName) {
  console.log(`Import: Loading JSON file '${fileName}'`);

  // Find and read the JSON file
  // eslint-disable-next-line no-useless-assignment -- Known limitation, used in try block
  let file = null;
  try {
    const files = DriveApp.getFilesByName(fileName);
    if (!files.hasNext()) throw new Error("File not found");
    file = files.next();
    console.log(`Import: Found file '${file.getName()}' (ID: ${file.getId()})`);
  } catch (err) {
    const errorMsg = `Error finding file ${err.message}`;
    console.log(`Import: ${errorMsg}`);
    return { data: {}, success: false, error: errorMsg };
  }

  // Parse the JSON content
  try {
    const importedData = JSON.parse(file.getBlob().getDataAsString());
    console.log("Import: JSON parsed successfully");
    return { data: importedData, success: true };
  } catch (err) {
    const errorMsg = `JSON parse error ${err.message}`;
    console.log(`Import: ${errorMsg}`);
    return { data: {}, success: false, error: errorMsg };
  }
}

/**
 * Calculate the dimensions needed for a sheet based on its content.
 * @param {object} sheetContent The JSON content for the sheet.
 * @returns {SheetDimensions} The calculated dimensions.
 */
function calculateSheetDimensions_(sheetContent) {
  let maxRow = 0;
  let maxCol = 0;

  for (const a1Notation in sheetContent) {
    const { row, col } = parseA1(a1Notation);
    if (row + 1 > maxRow) maxRow = row + 1;
    if (col + 1 > maxCol) maxCol = col + 1;
  }

  return { maxRow, maxCol };
}

/**
 * Resize the target sheet to accommodate the import data.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to resize.
 * @param {SheetDimensions} dimensions The required dimensions.
 * @returns {GoogleAppsScript.Spreadsheet.Range} The target range for import.
 */
function resizeTargetSheet_(sheet, dimensions) {
  const { maxRow, maxCol } = dimensions;

  // Resize sheet if necessary to accommodate data
  if (sheet.getMaxRows() < maxRow) {
    sheet.insertRowsAfter(sheet.getMaxRows(), maxRow - sheet.getMaxRows());
  }
  if (sheet.getMaxColumns() < maxCol) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      maxCol - sheet.getMaxColumns()
    );
  }

  return sheet.getRange(1, 1, maxRow, maxCol);
}

/**
 * Phase 1: Clear target sheet and import formulas only.
 * @param {ImportSheetConfig} config The import configuration.
 */
function importFormulasPhase_(config) {
  const { targetRange, sheetContent, sheetName } = config;
  const numRows = targetRange.getNumRows();
  const numCols = targetRange.getNumColumns();

  console.log(`Import: Phase 1 (Clear & Formulas) for '${sheetName}'`);
  targetRange.clearContent();

  // Create empty grid for formulas
  const formulasToSet = Array(numRows)
    .fill(0)
    .map(() => Array(numCols).fill(""));

  // Extract formulas from JSON content
  for (const a1Notation in sheetContent) {
    const content = sheetContent[a1Notation];
    const { row, col } = parseA1(a1Notation);
    if (typeof content === "string" && content.startsWith("=")) {
      formulasToSet[row][col] = content;
    }
  }

  targetRange.setFormulas(formulasToSet);
  console.log(
    `Import: Formulas written for '${sheetName}', waiting for spills...`
  );

  // Allow time for formulas to calculate and create spilled results
  const SLEEP_DURATION = 1000;
  Utilities.sleep(SLEEP_DURATION);
}

/**
 * Phase 2: Read current state and overlay static values.
 * @param {ImportSheetConfig} config The import configuration.
 */
function importStaticValuesPhase_(config) {
  const { targetRange, sheetContent, sheetName } = config;

  console.log(
    `Import: Phase 2 (Capture spills & overlay values) for '${sheetName}'`
  );

  // Contains spills and static values
  const currentValues = targetRange.getValues();
  // Contains formula strings if cell is source
  const currentFormulas = targetRange.getFormulas();

  // Initialize grid with existing formulas to preserve them
  const finalValuesToSet = currentFormulas.map((row) => [...row]);

  // Overlay static content from JSON onto empty cells only
  for (const a1Notation in sheetContent) {
    const content = sheetContent[a1Notation];
    const { row, col } = parseA1(a1Notation);

    // Process only non-formulas
    const isFormula = typeof content === "string" && content.startsWith("=");
    const cellIsEmpty =
      currentFormulas[row][col] === "" && currentValues[row][col] === "";

    if (!isFormula && cellIsEmpty) {
      finalValuesToSet[row][col] = tryParseDate(content);
    }
  }

  // Write the combined grid, preserving formulas/spills and inserting static values
  targetRange.setValues(finalValuesToSet);
  console.log(`Import: Static values overlaid for '${sheetName}'`);
}

/**
 * Process the import of content for a single sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} targetSheet The sheet to import into.
 * @param {object} sheetContent The JSON content for this sheet.
 * @param {string} sheetName Name of the sheet for logging.
 */
function processSheetContent_(targetSheet, sheetContent, sheetName) {
  // Calculate required dimensions and resize sheet
  const dimensions = calculateSheetDimensions_(sheetContent);
  const targetRange = resizeTargetSheet_(targetSheet, dimensions);

  // Create configuration object for import phases
  const config = {
    targetRange,
    sheetContent,
    sheetName,
  };

  // Execute two-phase import process
  importFormulasPhase_(config);
  importStaticValuesPhase_(config);
}

/**
 * Process all sheets from the imported JSON data.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet The target spreadsheet.
 * @param {object} importedData The parsed JSON data containing all sheets.
 * @returns {number} Number of sheets processed.
 */
function processImportData_(spreadsheet, importedData) {
  let sheetsProcessedCount = 0;
  const sheetNames = Object.keys(importedData);
  console.log(`Import: Sheets to process ${sheetNames.join(", ")}`);

  // Loop through each sheet in the JSON
  for (const sheetName of sheetNames) {
    console.log(`Import: Processing sheet '${sheetName}'`);
    const sheetContent = importedData[sheetName];
    let targetSheet = spreadsheet.getSheetByName(sheetName);

    // Create sheet if it doesn't exist
    if (!targetSheet) {
      targetSheet = spreadsheet.insertSheet(sheetName);
      console.log(`Import: Created new sheet '${sheetName}'`);
    }

    // Check if sheet has content to import
    const dimensions = calculateSheetDimensions_(sheetContent);
    if (dimensions.maxRow > 0 && dimensions.maxCol > 0) {
      processSheetContent_(targetSheet, sheetContent, sheetName);
    } else {
      console.log(
        `Import: No content found in sheet '${sheetName}', skipping.`
      );
    }
    sheetsProcessedCount++;
  }

  return sheetsProcessedCount;
}

/* exported importFromJson */
/**
 * Imports cell content (values and formulas) into the active Google Spreadsheet
 * from a JSON file located in Google Drive. This script uses a two-phase approach
 * to correctly import formulas and their spilled results.
 */
function importFromJson() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  console.log("Import: Starting import process");

  // Get filename from user
  const promptResult = promptForFileName_(ui);
  if (promptResult.cancelled) {
    return;
  }

  // Load and parse JSON file
  const loadResult = loadJsonFile_(promptResult.fileName);
  if (!loadResult.success) {
    return;
  }

  // Process all sheets from the imported data
  const sheetsProcessed = processImportData_(spreadsheet, loadResult.data);

  console.log(`Import: Complete. Processed ${sheetsProcessed} sheet(s).`);
}
