/**
 * @OnlyCurrentDoc
 * @file This script synchronizes checkboxes across multiple sheets in the active Google Sheet.
 * It's designed for a "Monster Collection" tracker. It also provides a developer utility
 * to convert checkbox columns from formulas to boolean values, which is intended to be
 * run manually from the Apps Script editor.
 */

/**
 * @typedef {Object} UpdateObject An object representing a single cell update.
 * @property {number} rowIndex The 1-based index of the row to update.
 * @property {boolean} newValue The new boolean value for the checkbox.
 */

/**
 * @typedef {Object} BatchObject An object representing a contiguous block of updates.
 * @property {number} startRow The 1-based index of the first row in the batch.
 * @property {Array<Array<boolean>>} values A 2D array of checkbox values to be written.
 */

// --- CONFIGURATION ---
// IMPORTANT: Add the names of all sheets you want to synchronize into this list.
// The script assumes for ALL these sheets:
// - Column A contains the checkboxes.
// - Column B contains the monster names.
const CONFIG = {
  syncSheetNames: [
    "Collection",
    "v257 PQ Mobs",
    "v257 2-Stars",
    "v257 2-Star Mobs",
    "Remaining",
    "Elites",
    "Field",
    "Quest",
    "Boss",
    "Dungeon",
    "Special",
    "Ref"
    // Eventually add "Next Mob" sheets
  ]
};
// --- END OF CONFIGURATION ---


/**
 * A developer utility function that finds all cells in the checkbox column (A) that are
 * formatted as a checkbox, contain a formula, AND have a corresponding monster name in Column B.
 * It replaces these formulas with a default `FALSE` value, while preserving all other formulas.
 * This is intended to be run manually from the Apps Script Editor.
 */
function flattenCheckboxFormulas() {
  console.log('Starting formula flattening process...');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const CHECKBOX_COL = 1; // Column A
  const NAME_COL = 2;     // Column B
  let sheetsAffected = 0;
  let formulasReplaced = 0;

  CONFIG.syncSheetNames.forEach(sheetName => {
    // We explicitly skip the main "Collection" sheet.
    if (sheetName === 'Collection') {
      return;
    }

    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      console.warn(`Sheet "${sheetName}" not found. Skipping.`);
      return;
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      return; // Sheet is empty.
    }
    
    // Read all relevant data in batch for efficiency.
    const checkboxColumnRange = sheet.getRange(1, CHECKBOX_COL, lastRow, 1);
    const nameColumnRange = sheet.getRange(1, NAME_COL, lastRow, 1);
    
    const checkboxFormulas = checkboxColumnRange.getFormulas();
    const checkboxValues = checkboxColumnRange.getValues();
    const checkboxValidations = checkboxColumnRange.getDataValidations();
    const nameValues = nameColumnRange.getValues();
    
    // This array will be rebuilt with the correct mix of values and formulas.
    const dataToWrite = [];
    let sheetHasChanges = false;
    
    for (let i = 0; i < lastRow; i++) {
      const hasFormula = checkboxFormulas[i][0] !== '';
      const validationRule = checkboxValidations[i][0];
      const isCheckbox = validationRule?.getCriteriaType() === SpreadsheetApp.DataValidationCriteria.CHECKBOX;
      const monsterName = nameValues[i][0]?.toString();

      // This is the key condition: the cell must be a checkbox, have a formula,
      // and be on a row with a monster name.
      if (isCheckbox && hasFormula && monsterName?.trim()) {
        // Condition met: flatten this cell to FALSE.
        dataToWrite.push([false]);
        formulasReplaced++;
        sheetHasChanges = true;
      } else if (hasFormula) {
        // It's a formula, but not one we want to flatten. Preserve it.
        dataToWrite.push([checkboxFormulas[i][0]]);
      } else {
        // It's just a static value. Preserve it.
        dataToWrite.push([checkboxValues[i][0]]);
      }
    }

    if (sheetHasChanges) {
      sheetsAffected++;
      console.log(`Found changes for sheet "${sheetName}". Applying now...`);
      // The setValues method correctly interprets strings starting with '=' as formulas.
      checkboxColumnRange.setValues(dataToWrite);
    }
  });
  
  console.log(`Operation Complete. Replaced ${formulasReplaced} formula(s) across ${sheetsAffected} sheet(s).`);
}


/**
 * The main trigger function that runs automatically when a user edits the spreadsheet.
 * It reads the entire state of the edited sheet and triggers a full synchronization.
 *
 * @param {Object} e The event object passed by the onEdit trigger.
 * @see https://developers.google.com/apps-script/guides/triggers/events
 */
function onEdit(e) {
  try {
    const range = e.range;
    const sheet = range.getSheet();
    const sheetName = sheet.getName();
    // Log only the first character of the user's email.
    const userInitial = e.user?.getEmail()?.charAt(0) ?? '?';
    const CHECKBOX_COL = 1; // Column A
    const NAME_COL = 2;     // Column B

    // --- Initial User Action Log ---
    console.log(`User Edit: User '${userInitial}' triggered sync from sheet '${sheetName}'. (Edit range: ${range.getA1Notation()})`);

    // --- Initial Checks ---
    // 1. Is the edited sheet in our configuration?
    if (!CONFIG.syncSheetNames.includes(sheetName)) {
      return;
    }
    // 2. Was the edit in the checkbox column? This prevents syncs when editing names, etc.
    if (range.getColumn() !== CHECKBOX_COL) {
      return;
    }

    // --- Data Acquisition from Source Sheet ---
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      return; // Sheet is completely empty.
    }
    
    // DEV COMMENT: We read the *entire* sheet instead of just the edited range (`e.range`).
    // This is crucial for handling the "spacebar toggle" on a multi-cell selection, where Sheets
    // only reports the active cell as edited. By reading the whole sheet, we capture the
    // final state regardless of how the edit was performed, making the sync robust.
    const sourceRange = sheet.getRange(1, CHECKBOX_COL, lastRow, NAME_COL - CHECKBOX_COL + 1);
    const sourceData = sourceRange.getValues();

    // DEV COMMENT: The script starts processing from row 1. It correctly skips over headers or
    // any other non-data rows (e.g., spacers) because of the validation checks below.
    // The checks for `typeof isChecked === 'boolean'` and a non-empty `monsterName` ensure
    // that only rows with valid, paired data are ever processed.
    const sourceDataMap = new Map();
    sourceData.forEach(row => {
      const isChecked = row[0];
      const monsterName = row[1]?.toString();
      if (typeof isChecked === 'boolean' && monsterName?.trim()) {
        const normalizedName = monsterName.replace(/\s+/g, ' ').trim();
        sourceDataMap.set(normalizedName, isChecked);
      }
    });

    if (sourceDataMap.size === 0) {
      console.log("Sync Check: No valid monster data found on source sheet. Halting.");
      return;
    }

    console.log(`Sync Plan: Syncing all ${sourceDataMap.size} monster states from sheet '${sheetName}'.`);

    // --- Synchronization ---
    syncAllSheets(sourceDataMap, sheetName);

  } catch (error) {
    // Log any errors to help with debugging.
    console.error(`An error occurred in onEdit: ${error.toString()}`);
  }
}

/**
 * Creates batches of contiguous row updates to be applied.
 *
 * @param {Array<UpdateObject>} updatesToApply An array of objects, each with a rowIndex and a newValue.
 * @returns {Array<BatchObject>} An array of batch objects, each with a startRow and a values array.
 */
function groupUpdatesIntoBatches(updatesToApply) {
  if (updatesToApply.length === 0) {
    return [];
  }

  // Sort updates by row index to ensure they are in order.
  updatesToApply.sort((a, b) => a.rowIndex - b.rowIndex);

  const batches = [];
  let currentBatch = { startRow: updatesToApply[0].rowIndex, values: [[updatesToApply[0].newValue]] };

  for (let i = 1; i < updatesToApply.length; i++) {
    // If the current row is exactly one after the previous, it's a contiguous block.
    if (updatesToApply[i].rowIndex === updatesToApply[i - 1].rowIndex + 1) {
      currentBatch.values.push([updatesToApply[i].newValue]);
    } else {
      // The block is broken; push the completed batch and start a new one.
      batches.push(currentBatch);
      currentBatch = { startRow: updatesToApply[i].rowIndex, values: [[updatesToApply[i].newValue]] };
    }
  }
  // Add the final batch to the list.
  batches.push(currentBatch);

  return batches;
}

/**
 * Syncs all configured sheets to match the state provided in the sourceDataMap.
 * Uses batch operations to read and write data for maximum performance, skipping formulas.
 *
 * @param {Map<string, boolean>} sourceDataMap A map of normalized monster names to their checkbox state.
 * @param {string} originatingSheetName The name of the sheet the data came from, which will be skipped.
 */
function syncAllSheets(sourceDataMap, originatingSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const CHECKBOX_COL = 1; // Column A
  const NAME_COL = 2;     // Column B

  CONFIG.syncSheetNames.forEach(sheetName => {
    // Skip the sheet that was the source of the changes.
    if (sheetName === originatingSheetName) {
      return;
    }

    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return;
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      return; // Target sheet is empty.
    }

    // Read all checkbox values, name values, AND formulas from the target sheet in one batch.
    const targetRange = sheet.getRange(1, CHECKBOX_COL, lastRow, NAME_COL - CHECKBOX_COL + 1);
    const targetData = targetRange.getValues();
    const targetFormulas = targetRange.getFormulas();

    const updatesToApply = [];

    // Compare each monster on the target sheet with the source data.
    targetData.forEach((row, index) => {
      const currentCheckedState = row[0];
      const monsterName = row[1]?.toString();
      const hasFormula = targetFormulas[index][0] !== '';
      
      // We only proceed if there is a valid monster name and the cell does NOT have a formula.
      if (!hasFormula && monsterName?.trim()) {
        const normalizedName = monsterName.replace(/\s+/g, ' ').trim();
        
        // If the monster exists in our source map and its state is different...
        if (sourceDataMap.has(normalizedName) && sourceDataMap.get(normalizedName) !== currentCheckedState) {
          // ...add this change to our list of updates to apply.
          updatesToApply.push({ rowIndex: index + 1, newValue: sourceDataMap.get(normalizedName) });
        }
      }
    });
    
    // Group the individual updates into contiguous batches.
    const batches = groupUpdatesIntoBatches(updatesToApply);

    // If we have batches, apply them.
    if (batches.length > 0) {
      let totalChanges = 0;
      batches.forEach(batch => {
        totalChanges += batch.values.length;
        const checkboxRange = sheet.getRange(batch.startRow, CHECKBOX_COL, batch.values.length, 1);
        checkboxRange.setValues(batch.values);
      });
      console.log(`Script Action: Applied ${totalChanges} updates to sheet '${sheetName}' in ${batches.length} batch(es).`);
    } else {
      console.log(`Sync Check: Sheet '${sheetName}' is already in sync or has no updatable cells. No changes needed.`);
    }
  });
}