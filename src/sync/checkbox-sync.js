"use strict";

/**
 * @OnlyCurrentDoc
 * @file Checkbox synchronization system for monster collection sheets.
 * This script synchronizes checkboxes across multiple sheets in the active Google Sheet.
 * It's designed for a "Monster Collection" tracker and runs automatically via onEdit trigger.
 * 
 * Requires: config.js (for CONFIG object)
 */

/* global CONFIG */

/**
 * @typedef {object} UpdateObject An object representing a single cell update.
 * @property {number} rowIndex The 1-based index of the row to update.
 * @property {boolean} newValue The new boolean value for the checkbox.
 */

/**
 * @typedef {object} BatchObject An object representing a contiguous block of updates.
 * @property {number} startRow The 1-based index of the first row in the batch.
 * @property {Array<Array<boolean>>} values A 2D array of checkbox values to be written.
 */

/**
 * Determines if a cell should be skipped during synchronization.
 * @param {boolean} hasFormula Whether the cell contains a formula.
 * @param {string} monsterName The monster name from the row.
 * @returns {boolean} True if the cell should be skipped.
 */
function shouldSkipCell_(hasFormula, monsterName) {
  return hasFormula || !monsterName?.trim();
}

/**
 * Reads target sheet data including values, formulas, and names.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to read from.
 * @returns {object|null} Object containing targetData and targetFormulas, or null if empty.
 */
function readTargetSheetData_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    return null;
  }

  const CHECKBOX_COL = 1; // Column A
  const NAME_COL = 2; // Column B

  const targetRange = sheet.getRange(
    1,
    CHECKBOX_COL,
    lastRow,
    NAME_COL - CHECKBOX_COL + 1
  );
  
  return {
    targetData: targetRange.getValues(),
    targetFormulas: targetRange.getFormulas(),
  };
}

/**
 * Finds updates needed for a target sheet by comparing with source data.
 * @param {object} sheetData Object containing targetData and targetFormulas arrays.
 * @param {Map<string, boolean>} sourceDataMap Map of normalized monster names to checkbox states.
 * @returns {Array<UpdateObject>} Array of updates to apply.
 */
function findUpdatesForSheet_(sheetData, sourceDataMap) {
  const { targetData, targetFormulas } = sheetData;
  const updatesToApply = [];

  targetData.forEach((row, index) => {
    const currentCheckedState = row[0];
    const monsterName = row[1]?.toString();
    const hasFormula = targetFormulas[index][0] !== "";

    if (shouldSkipCell_(hasFormula, monsterName)) {
      return;
    }

    const normalizedName = monsterName.replace(/\s+/gv, " ").trim();

    if (
      sourceDataMap.has(normalizedName) &&
      sourceDataMap.get(normalizedName) !== currentCheckedState
    ) {
      updatesToApply.push({
        rowIndex: index + 1,
        newValue: sourceDataMap.get(normalizedName),
      });
    }
  });

  return updatesToApply;
}

/**
 * Creates batches of contiguous row updates to be applied.
 * @param {Array<UpdateObject>} updatesToApply An array of objects, each with a rowIndex and a newValue.
 * @returns {Array<BatchObject>} An array of batch objects, each with a startRow and a values array.
 */
function groupUpdatesIntoBatches_(updatesToApply) {
  if (updatesToApply.length === 0) {
    return [];
  }

  // Sort updates by row index to ensure they are in order.
  updatesToApply.sort(
    (updateObj1, updateObj2) => updateObj1.rowIndex - updateObj2.rowIndex
  );

  const batches = [];
  let currentBatch = {
    startRow: updatesToApply[0].rowIndex,
    values: [[updatesToApply[0].newValue]],
  };

  for (let idx = 1; idx < updatesToApply.length; idx++) {
    // If the current row is exactly one after the previous, it's a contiguous block.
    if (updatesToApply[idx].rowIndex === updatesToApply[idx - 1].rowIndex + 1) {
      currentBatch.values.push([updatesToApply[idx].newValue]);
    } else {
      // The block is broken; push the completed batch and start a new one.
      batches.push(currentBatch);
      currentBatch = {
        startRow: updatesToApply[idx].rowIndex,
        values: [[updatesToApply[idx].newValue]],
      };
    }
  }
  // Add the final batch to the list.
  batches.push(currentBatch);

  return batches;
}

/**
 * Applies batched updates to a target sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to update.
 * @param {Array<UpdateObject>} updates Array of updates to apply.
 * @param {string} sheetName Name of the sheet for logging purposes.
 */
function applyBatchesToSheet_(sheet, updates, sheetName) {
  if (updates.length === 0) {
    console.log(
      `Sync Check: Sheet '${sheetName}' is already in sync or has no updatable cells. No changes needed.`
    );
    return;
  }

  const CHECKBOX_COL = 1; // Column A
  const batches = groupUpdatesIntoBatches_(updates);
  let totalChanges = 0;

  batches.forEach((batch) => {
    totalChanges += batch.values.length;
    const checkboxRange = sheet.getRange(
      batch.startRow,
      CHECKBOX_COL,
      batch.values.length,
      1
    );
    checkboxRange.setValues(batch.values);
  });

  console.log(
    `Script Action: Applied ${totalChanges} updates to sheet '${sheetName}' in ${batches.length} batch(es).`
  );
}

/**
 * Syncs all configured sheets to match the state provided in the sourceDataMap.
 * Uses batch operations to read and write data for maximum performance, skipping formulas.
 * @param {Map<string, boolean>} sourceDataMap A map of normalized monster names to their checkbox state.
 * @param {string} originatingSheetName The name of the sheet the data came from, which will be skipped.
 */
function syncAllSheets_(sourceDataMap, originatingSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  CONFIG.syncSheetNames.forEach((sheetName) => {
    if (sheetName === originatingSheetName) {
      return;
    }

    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return;
    }

    const sheetData = readTargetSheetData_(sheet);
    if (!sheetData) {
      return;
    }

    const updates = findUpdatesForSheet_(sheetData, sourceDataMap);
    applyBatchesToSheet_(sheet, updates, sheetName);
  });
}

/**
 * Validates if the edit event should trigger synchronization.
 * @param {object} event The event object from onEdit trigger.
 * @returns {{valid: boolean, sheetName: string}|{valid: boolean}} Validation result with sheet info.
 */
function validateEditEvent_(event) {
  const range = event.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  // Log only the first character of the user's email.
  const userInitial = event.user?.getEmail()?.charAt(0) ?? "?";
  const CHECKBOX_COL = 1; // Column A

  // --- Initial User Action Log ---
  console.log(
    `User Edit: User '${userInitial}' triggered sync from sheet '${sheetName}'. (Edit range: ${range.getA1Notation()})`
  );

  // --- Initial Checks ---
  // 1. Is the edited sheet in our configuration?
  if (!CONFIG.syncSheetNames.includes(sheetName)) {
    return { valid: false };
  }
  // 2. Was the edit in the checkbox column? This prevents syncs when editing names, etc.
  if (range.getColumn() !== CHECKBOX_COL) {
    return { valid: false };
  }

  return { valid: true, sheetName };
}

/**
 * Reads and processes monster data from the source sheet into a normalized map.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to read data from.
 * @returns {Map<string, boolean>|null} Map of normalized monster names to checkbox states, or null if no data.
 */
function extractMonsterDataFromSheet_(sheet) {
  const CHECKBOX_COL = 1; // Column A
  const NAME_COL = 2; // Column B

  // --- Data Acquisition from Source Sheet ---
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    // Sheet is completely empty.
    return null;
  }

  // DEV COMMENT: We read the *entire* sheet instead of just the edited range (`e.range`).
  // This is crucial for handling the "spacebar toggle" on a multi-cell selection, where Sheets
  // only reports the active cell as edited. By reading the whole sheet, we capture the
  // final state regardless of how the edit was performed, making the sync robust.
  const sourceRange = sheet.getRange(
    1,
    CHECKBOX_COL,
    lastRow,
    NAME_COL - CHECKBOX_COL + 1
  );
  const sourceData = sourceRange.getValues();

  // DEV COMMENT: The script starts processing from row 1. It correctly skips over headers or
  // any other non-data rows (e.g., spacers) because of the validation checks below.
  // The checks for `typeof isChecked === 'boolean'` and a non-empty `monsterName` ensure
  // that only rows with valid, paired data are ever processed.
  const sourceDataMap = new Map();
  sourceData.forEach((row) => {
    const isChecked = row[0];
    const monsterName = row[1]?.toString();
    if (typeof isChecked === "boolean" && monsterName?.trim()) {
      const normalizedName = monsterName.replace(/\s+/gv, " ").trim();
      sourceDataMap.set(normalizedName, isChecked);
    }
  });

  if (sourceDataMap.size === 0) {
    console.log(
      "Sync Check: No valid monster data found on source sheet. Halting."
    );
    return null;
  }

  return sourceDataMap;
}

/* exported onEdit */
/**
 * The main trigger function that runs automatically when a user edits the spreadsheet.
 * It reads the entire state of the edited sheet and triggers a full synchronization.
 * @param {object} event The event object passed by the onEdit trigger.
 * @see https://developers.google.com/apps-script/guides/triggers/events
 */
function onEdit(event) {
  try {
    const validation = validateEditEvent_(event);
    if (!validation.valid) {
      return;
    }

    const sheet = event.range.getSheet();
    const sourceDataMap = extractMonsterDataFromSheet_(sheet);
    if (!sourceDataMap) {
      return;
    }

    console.log(
      `Sync Plan: Syncing all ${sourceDataMap.size} monster states from sheet '${validation.sheetName}'.`
    );

    // --- Synchronization ---
    syncAllSheets_(sourceDataMap, validation.sheetName);
  } catch (error) {
    // Log any errors to help with debugging.
    console.error(`An error occurred in onEdit: ${error.toString()}`);
  }
}