"use strict";

/**
 * @OnlyCurrentDoc
 *
 * This script provides functions to export spreadsheet data (values and formulas)
 * to a JSON file stored in Google Drive. This allows for backing up a
 * spreadsheet's state.
 */

/* global columnToLetter -- used in extractCellData_() */

/**
 * Extract values and formulas from a range.
 * @param {GoogleAppsScript.Spreadsheet.Range} range The range to extract data from.
 * @returns {object} Object mapping A1 notation to cell content.
 */
function extractCellData_(range) {
  // 2D array of displayed values
  const values = range.getValues();
  // 2D array of formula strings (empty string if no formula)
  const formulas = range.getFormulas();

  const cellData = {};
  for (let row = 0; row < values.length; row++) {
    for (let col = 0; col < values[row].length; col++) {
      const value = values[row][col];
      const formula = formulas[row][col];

      // Only process cells with content
      if (value !== "" || formula !== "") {
        const a1Notation = columnToLetter(col + 1) + String(row + 1);

        // Store formula if present, store value otherwise
        if (formula) {
          cellData[a1Notation] = formula;
        } else {
          cellData[a1Notation] = value;
        }
      }
    }
  }
  return cellData;
}

/**
 * Process a single sheet and return its cell data.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to process.
 * @returns {object|null} The sheet's cell data or null if empty.
 */
function processSheet_(sheet) {
  const sheetName = sheet.getName();
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  console.log(
    `Processing sheet: "${sheetName}" (Last Row: ${lastRow}, Last Column: ${lastColumn})`
  );

  if (lastRow === 0 || lastColumn === 0) {
    console.log(`Skipping empty sheet: "${sheetName}"`);
    return null;
  }

  const range = sheet.getRange(1, 1, lastRow, lastColumn);
  return extractCellData_(range);
}

/**
 * Generate a timestamped filename for the export.
 * @param {string} spreadsheetName The name of the spreadsheet.
 * @returns {string} The generated filename.
 */
function generateFileName_(spreadsheetName) {
  const timestamp = new Date().toISOString().replace(/:/gv, "-");
  return `${spreadsheetName}_content_and_formulas_${timestamp}.json`;
}

/**
 * Save data to Google Drive as a JSON file.
 * @param {object} data The data to save.
 * @param {string} fileName The filename to use.
 */
function saveToGoogleDrive_(data, fileName) {
  // Convert to JSON string, pretty-printing with 2 spaces per tab
  const SPACING = 2;
  const jsonOutput = JSON.stringify(data, null, SPACING);

  try {
    DriveApp.createFile(fileName, jsonOutput, "application/json");
    console.log(`Saved JSON file to Google Drive: '${fileName}'`);
  } catch (err) {
    console.log(`Error saving file to Drive: ${err.message}`);
  }
}

/* exported exportToJson */
/**
 * Exports all cell content (values and formulas) from the active Google Spreadsheet
 * to a JSON file in Google Drive. This script is optimized to minimize API calls.
 */
function exportToJson() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const allCellData = {};

  console.log("Starting export process...");

  // Process each sheet in the spreadsheet
  spreadsheet.getSheets().forEach((sheet) => {
    const sheetData = processSheet_(sheet);
    if (sheetData) {
      allCellData[sheet.getName()] = sheetData;
    }
  });

  const fileName = generateFileName_(spreadsheet.getName());
  saveToGoogleDrive_(allCellData, fileName);

  console.log("Export process finished.");
}
