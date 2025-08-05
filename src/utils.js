/**
 * @OnlyCurrentDoc
 */

/**
 * Combines values and formulas arrays into a single 2D array, prioritizing formulas.
 *
 * @param {any[][]} values The 2D array of cell values.
 * @param {string[][]} formulas The 2D array of cell formulas.
 * @returns {any[][]} A new 2D array with formulas taking precedence over values.
 * @throws {Error} If the dimensions of values and formulas do not match.
 * @private
 */
function combineValuesAndFormulas_(values, formulas) {
  const numRows = formulas.length;
  if (numRows !== values.length) {
    throw new Error(`Row dimension mismatch: formulas has ${numRows} rows, but values has ${values.length} rows.`);
  }

  if (numRows === 0) {
    return [];
  }
  const combinedData = new Array(numRows);

  for (let r = 0; r < numRows; r++) {
    const numCols = formulas[r].length;
    if (numCols !== values[r].length) {
      throw new Error(`Column dimension mismatch in row ${r}: formulas has ${numCols} columns, but values has ${values[r].length} columns.`);
    }
    const row = new Array(numCols);
    for (let c = 0; c < numCols; c++) {
      if (formulas[r][c]) {
        row[c] = formulas[r][c];
      } else {
        row[c] = values[r][c];
      }
    }
    combinedData[r] = row;
  }
  return combinedData;
}

/**
 * Imports data from a range, preserving formulas.
 *
 * @param {GoogleAppsScript.Spreadsheet.Range} range The range to import data from.
 * @returns {any[][]} A 2D array of combined values and formulas.
 * @throws {Error} If the provided range is invalid.
 * @private
 */
function importRange_(range) {
  if (!range || typeof range.getA1Notation !== 'function') {
    throw new Error('Invalid input: "range" must be a valid Apps Script Range object.');
  }
  console.log(`Importing data from range: ${range.getA1Notation()}`);
  const values = range.getValues();
  const formulas = range.getFormulas();
  return combineValuesAndFormulas_(values, formulas);
}

/**
 * Exports data to a range by combining separate values and formulas arrays.
 *
 * @param {GoogleAppsScript.Spreadsheet.Range} range The range to export data to.
 * @param {any[][]} values The 2D array of values.
 * @param {string[][]} formulas The 2D array of formulas.
 * @throws {Error} If the provided range is invalid, or if the data array dimensions mismatch.
 * @private
 */
function exportRange_(range, values, formulas) {
  if (!range || typeof range.getA1Notation !== 'function') {
    throw new Error('Invalid input: "range" must be a valid Apps Script Range object.');
  }
  console.log(`Exporting data to range: ${range.getA1Notation()}`);
  const combinedData = combineValuesAndFormulas_(values, formulas);

  if (combinedData.length > 0) {
    range.setValues(combinedData);
  } else {
    // If the provided data is empty, clear the target range
    // to avoid a dimension mismatch error with setValues.
    range.clearContent();
  }
}

/**
 * Normalizes a string by converting it to a string, trimming whitespace from both ends,
 * and collapsing multiple whitespace characters into a single space.
 *
 * @param {*} str The input to normalize.
 * @returns {string} The normalized string.
 * @private
 */
function normalizeString_(str) {
  return str.toString().trim().replace(/\s+/g, ' ');
}