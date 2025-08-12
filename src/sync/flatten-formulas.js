"use strict";

/**
 * @OnlyCurrentDoc
 * @file Developer utility for flattening checkbox formulas in monster collection sheets.
 * This script provides a function to convert checkbox columns from formulas to boolean values,
 * which is intended to be run manually from the Apps Script editor.
 * 
 * Requires: config.js (for CONFIG object)
 */

/* global CONFIG */

/**
 * @typedef {object} SheetFlatteningData Data structure containing all information needed for flattening analysis.
 * @property {Array<Array<string>>} checkboxFormulas 2D array of formulas from the checkbox column.
 * @property {Array<Array<*>>} checkboxValues 2D array of values from the checkbox column.
 * @property {Array<Array<GoogleAppsScript.Spreadsheet.DataValidation>>} checkboxValidations 2D array of data validations.
 * @property {Array<Array<*>>} nameValues 2D array of values from the monster name column.
 * @property {number} lastRow The last row number with data in the sheet.
 * @property {GoogleAppsScript.Spreadsheet.Range} checkboxColumnRange The range object for the checkbox column.
 */

/**
 * @typedef {object} FlatteningResult Result of building the flattened data array.
 * @property {Array<Array<*>>} dataToWrite 2D array of data to write back to the sheet.
 * @property {number} formulasFlattened Number of formulas that were flattened to FALSE.
 */

/**
 * Reads sheet data needed for formula flattening analysis.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to read from.
 * @returns {SheetFlatteningData|null} Object containing all necessary data arrays, or null if empty.
 */
function readSheetDataForFlattening_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    return null;
  }

  const CHECKBOX_COL = 1; // Column A
  const NAME_COL = 2; // Column B

  // Read all data in batch operations for performance
  const checkboxColumnRange = sheet.getRange(1, CHECKBOX_COL, lastRow, 1);
  const nameColumnRange = sheet.getRange(1, NAME_COL, lastRow, 1);

  return {
    checkboxFormulas: checkboxColumnRange.getFormulas(),
    checkboxValues: checkboxColumnRange.getValues(),
    checkboxValidations: checkboxColumnRange.getDataValidations(),
    nameValues: nameColumnRange.getValues(),
    lastRow,
    checkboxColumnRange,
  };
}

/**
 * Determines if a cell should be flattened to FALSE.
 * A cell should be flattened if it's a checkbox with a formula on a row with a monster name.
 * @param {boolean} hasFormula Whether the cell contains a formula.
 * @param {boolean} isCheckbox Whether the cell is formatted as a checkbox.
 * @param {string} monsterName The monster name from the row.
 * @returns {boolean} True if the cell should be flattened.
 */
function shouldFlattenCell_(hasFormula, isCheckbox, monsterName) {
  return hasFormula && isCheckbox && monsterName?.trim();
}

/**
 * Processes a single row to determine what value should be written back.
 * @param {SheetFlatteningData} sheetData Object containing all data for the sheet.
 * @param {number} rowIndex The zero-based index of the row.
 * @returns {Array} Single-element array containing the value to write.
 */
function processRowForFlattening_(sheetData, rowIndex) {
  // Extract data for this specific row
  const hasFormula = sheetData.checkboxFormulas[rowIndex][0] !== "";
  const validationRule = sheetData.checkboxValidations[rowIndex][0];
  const isCheckbox =
    validationRule?.getCriteriaType() ===
    SpreadsheetApp.DataValidationCriteria.CHECKBOX;
  const monsterName = sheetData.nameValues[rowIndex][0]?.toString();

  // Apply the flattening logic
  if (shouldFlattenCell_(hasFormula, isCheckbox, monsterName)) {
    // This checkbox formula should be flattened to FALSE
    return [false];
  } else if (hasFormula) {
    // This is a formula we want to preserve (not a checkbox or no monster name)
    return [sheetData.checkboxFormulas[rowIndex][0]];
  }
  // This is a static value; preserve it as-is
  return [sheetData.checkboxValues[rowIndex][0]];
}

/**
 * Builds the data array to write back to the sheet and counts flattened formulas.
 * @param {SheetFlatteningData} sheetData Object containing all data for the sheet.
 * @returns {FlatteningResult} Object with data array and count.
 */
function buildFlattenedDataArray_(sheetData) {
  const dataToWrite = [];
  let formulasFlattened = 0;

  // Process each row to determine what should be written back
  for (let row = 0; row < sheetData.lastRow; row++) {
    const processedValue = processRowForFlattening_(sheetData, row);
    dataToWrite.push(processedValue);

    // Count if this row was actually flattened (had a formula that became FALSE)
    const wasFlattened = processedValue[0] === false && 
                        sheetData.checkboxFormulas[row][0] !== "";
    if (wasFlattened) {
      formulasFlattened++;
    }
  }

  return { dataToWrite, formulasFlattened };
}

/**
 * Processes a single sheet for formula flattening.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to process.
 * @param {string} sheetName The name of the sheet for logging.
 * @returns {number} Number of formulas replaced in this sheet.
 */
function processSheetForFlattening_(sheet, sheetName) {
  // Read all necessary data from the sheet
  const sheetData = readSheetDataForFlattening_(sheet);
  if (!sheetData) {
    return 0;
  }

  // Build the array of data to write back and count changes
  const { dataToWrite, formulasFlattened } = buildFlattenedDataArray_(sheetData);

  // Apply changes if any formulas were flattened
  if (formulasFlattened > 0) {
    console.log(`Found changes for sheet "${sheetName}". Applying now...`);
    // The setValues method correctly interprets strings starting with '=' as formulas
    sheetData.checkboxColumnRange.setValues(dataToWrite);
  }

  return formulasFlattened;
}

/* exported flattenCheckboxFormulas */
/**
 * A developer utility function that finds all cells in the checkbox column (A) that are
 * formatted as a checkbox, contain a formula, AND have a corresponding monster name in Column B.
 * It replaces these formulas with a default `FALSE` value, while preserving all other formulas.
 * This is intended to be run manually from the Apps Script Editor.
 */
function flattenCheckboxFormulas() {
  console.log("Starting formula flattening process...");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetsAffected = 0;
  let totalFormulasReplaced = 0;

  // Process each configured sheet (except Collection)
  CONFIG.syncSheetNames.forEach((sheetName) => {
    // Skip the main Collection sheet as it shouldn't be flattened
    if (sheetName === "Collection") {
      return;
    }

    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      console.warn(`Sheet "${sheetName}" not found. Skipping.`);
      return;
    }

    // Process this sheet and count the changes made
    const formulasReplaced = processSheetForFlattening_(sheet, sheetName);
    if (formulasReplaced > 0) {
      sheetsAffected++;
      totalFormulasReplaced += formulasReplaced;
    }
  });

  console.log(
    `Operation Complete. Replaced ${totalFormulasReplaced} formula(s) across ${sheetsAffected} sheet(s).`
  );
}