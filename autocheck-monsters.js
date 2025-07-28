/**
 * @OnlyCurrentDoc
 * @file This script synchronizes checkboxes across multiple sheets in the active Google Sheet.
 * It's designed for a "Monster Collection" tracker. When a user edits a checkbox on any
 * configured sheet, this script treats that sheet as the "source of truth" and updates all
 * other configured sheets to match its state. This approach ensures that multi-cell toggles
 * (using the spacebar) work as expected. It uses high-performance batch operations for
 * reading and writing data to handle large sheets efficiently.
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
      const monsterName = row[1].toString();
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
 * Syncs all configured sheets to match the state provided in the sourceDataMap.
 * Uses batch operations to read and write data for maximum performance.
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

    // Read all checkbox and name data from the target sheet in one batch.
    const targetRange = sheet.getRange(1, CHECKBOX_COL, lastRow, NAME_COL - CHECKBOX_COL + 1);
    const targetData = targetRange.getValues();

    // Create a mutable copy of the checkbox column's data. This will be modified and written back.
    const newCheckboxValues = targetData.map(row => [row[0]]);
    let changesMade = 0;

    // Compare each monster on the target sheet with the source data.
    targetData.forEach((row, index) => {
      const currentCheckedState = row[0];
      const monsterName = row[1].toString();
      
      if (monsterName?.trim()) {
        const normalizedName = monsterName.replace(/\s+/g, ' ').trim();
        
        // If the monster exists in our source map and its state is different...
        if (sourceDataMap.has(normalizedName) && sourceDataMap.get(normalizedName) !== currentCheckedState) {
          // ...update its state in our new data array.
          newCheckboxValues[index][0] = sourceDataMap.get(normalizedName);
          changesMade++;
        }
      }
    });
    
    // If we found any differences, apply all changes in a single batch write.
    if (changesMade > 0) {
      const checkboxRange = sheet.getRange(1, CHECKBOX_COL, newCheckboxValues.length, 1);
      console.log(`Script Action: Applying ${changesMade} updates to sheet '${sheetName}' in one batch.`);
      checkboxRange.setValues(newCheckboxValues);
    } else {
      console.log(`Sync Check: Sheet '${sheetName}' is already in sync. No changes needed.`);
    }
  });
}