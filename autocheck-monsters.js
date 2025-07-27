/**
 * @OnlyCurrentDoc
 * @file This script synchronizes checkboxes across multiple sheets in the active Google Sheet.
 * It's designed for a "Monster Collection" tracker. It assumes that on all relevant sheets,
 * checkboxes are in Column A and the corresponding monster name is in Column B. This version
 * is capable of handling multi-cell edits, such as pasting or dragging to fill multiple checkboxes
 * at once. It runs directly off the user's edit action.
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
 * It identifies all relevant checkboxes within an edited range and initiates synchronization.
 *
 * @param {Object} e The event object passed by the onEdit trigger.
 * @see https://developers.google.com/apps-script/guides/triggers/events
 */
function onEdit(e) {
  try {
    const range = e.range;
    const sheet = range.getSheet();
    const sheetName = sheet.getName();
    const CHECKBOX_COL = 1; // Column A
    const NAME_COL = 2;     // Column B

    // --- Initial Checks ---
    // 1. Is the edited sheet in our configuration?
    if (!CONFIG.syncSheetNames.includes(sheetName)) {
      return;
    }
    // 2. Does the edited range intersect with the checkbox column at all?
    if (range.getLastColumn() < CHECKBOX_COL || range.getColumn() > CHECKBOX_COL) {
      return;
    }

    // --- Data Acquisition & Processing ---
    // Get all checkbox and name values from the affected rows in one batch operation.
    const firstRow = range.getRow();
    const numRows = range.getNumRows();
    const checkboxValues = sheet.getRange(firstRow, CHECKBOX_COL, numRows, 1).getValues();
    const nameValues = sheet.getRange(firstRow, NAME_COL, numRows, 1).getValues();

    const monstersToSyncMap = new Map();

    // Loop once over the affected rows.
    for (let i = 0; i < numRows; i++) {
      const isChecked = checkboxValues[i][0];
      // Only process actual boolean TRUE/FALSE from checkboxes.
      if (typeof isChecked !== 'boolean') {
        continue;
      }

      const monsterName = nameValues[i][0].toString();
      if (!monsterName || !monsterName.trim()) {
        continue;
      }

      const normalizedName = monsterName.replace(/\s+/g, ' ').trim();
      // Use a Map to store the latest state, ensuring each monster is synced only once per edit.
      monstersToSyncMap.set(normalizedName, isChecked);
    }

    if (monstersToSyncMap.size === 0) {
      return; // No valid checkboxes were found in the edited range.
    }

    // --- Synchronization ---
    // Directly iterate over the collected monster states and sync them.
    for (const [name, isChecked] of monstersToSyncMap.entries()) {
      syncAllCheckboxes(name, isChecked, sheetName);
    }

  } catch (error) {
    // Log any errors to help with debugging.
    console.error(`An error occurred in onEdit: ${error.toString()}`);
  }
}

/**
 * Finds all instances of a given monster across all configured sheets and updates
 * their checkbox state. It compares names in a normalized way to handle newlines.
 *
 * @param {string} normalizedMonsterName The space-normalized name of the monster to search for.
 * @param {boolean} isChecked The new state for the checkbox (true for checked, false for unchecked).
 * @param {string} originatingSheetName The name of the sheet where the edit was made, to avoid updating it unnecessarily.
 */
function syncAllCheckboxes(normalizedMonsterName, isChecked, originatingSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const CHECKBOX_COL = 1; // Column A
  const NAME_COL = 2;     // Column B

  CONFIG.syncSheetNames.forEach(sheetName => {
    // Skip the sheet where the original edit happened.
    if (sheetName === originatingSheetName) {
      return;
    }
    
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return;
    }

    // Get all names from the name column to perform a manual, normalized search.
    // We start from row 2 to account for a potential header row.
    const firstDataRow = 2;
    const lastRow = sheet.getLastRow();
    if (lastRow < firstDataRow) {
      return; // Sheet has no data to search.
    }
    const namesRange = sheet.getRange(firstDataRow, NAME_COL, lastRow - firstDataRow + 1);
    const namesData = namesRange.getValues();

    // Find all rows that match the normalized monster name.
    namesData.forEach((row, index) => {
        const currentName = row[0].toString();
        // Normalize the name from the sheet in the same way as the source name.
        const normalizedCurrentName = currentName.replace(/\s+/g, ' ').trim();

        if (normalizedCurrentName === normalizedMonsterName) {
            // Calculate the actual row number in the sheet.
            const targetRow = firstDataRow + index;
            const checkboxCell = sheet.getRange(targetRow, CHECKBOX_COL);
            
            // Only update if the value is different to avoid unnecessary edits.
            if (checkboxCell.isChecked() !== isChecked) {
                checkboxCell.setValue(isChecked);
            }
        }
    });
  });
}