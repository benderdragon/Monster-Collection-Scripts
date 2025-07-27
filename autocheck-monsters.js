/**
 * @OnlyCurrentDoc
 * @file This script synchronizes checkboxes across multiple sheets in the active Google Sheet.
 * It's designed for a "Monster Collection" tracker. It assumes that on all relevant sheets,
 * checkboxes are in Column A and the corresponding monster name is in Column B. This version
 * is capable of handling multi-cell edits, such as pasting or dragging to fill multiple checkboxes
 * at once. It uses a granular locking mechanism to allow for rapid edits on different monsters.
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
  // This Map stores the final state of each unique monster edited in the range.
  // It must be declared here to be accessible in the `finally` block.
  let monstersToProcess = new Map();

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

    // Loop once over the affected rows. This is much more efficient.
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
      // Use a Map to store the latest state, ensuring each monster is synced only once.
      monstersToSyncMap.set(normalizedName, isChecked);
    }

    if (monstersToSyncMap.size === 0) {
      return; // No valid checkboxes were found in the edited range.
    }

    // --- Locking ---
    const scriptProperties = PropertiesService.getScriptProperties();
    const lockValue = scriptProperties.getProperty('SYNC_LOCK') || '';
    const lockedMonsters = new Set(lockValue.split(',').filter(Boolean));

    // Filter out any monsters that are already being synced from a previous run.
    for (const [name, isChecked] of monstersToSyncMap.entries()) {
      if (!lockedMonsters.has(name)) {
        monstersToProcess.set(name, isChecked);
      }
    }

    if (monstersToProcess.size === 0) {
      return; // All monsters in this edit batch were already locked.
    }

    // Add the new, unlocked monsters to the lock property.
    for (const name of monstersToProcess.keys()) {
      lockedMonsters.add(name);
    }
    scriptProperties.setProperty('SYNC_LOCK', Array.from(lockedMonsters).join(','));

    // --- Synchronization ---
    for (const [name, isChecked] of monstersToProcess.entries()) {
      syncAllCheckboxes(name, isChecked, sheetName);
    }

  } catch (error) {
    console.error(`An error occurred in onEdit: ${error.toString()}`);
  } finally {
    // --- Unlocking ---
    // This runs whether the 'try' block succeeded or failed, ensuring locks are removed.
    if (monstersToProcess.size > 0) {
      const scriptProperties = PropertiesService.getScriptProperties();
      const lockValue = scriptProperties.getProperty('SYNC_LOCK') || '';
      const lockedMonsters = new Set(lockValue.split(',').filter(Boolean));

      // Remove the monsters that are now done syncing.
      for (const name of monstersToProcess.keys()) {
        lockedMonsters.delete(name);
      }

      if (lockedMonsters.size > 0) {
        scriptProperties.setProperty('SYNC_LOCK', Array.from(lockedMonsters).join(','));
      } else {
        // If no monsters are left in the lock, delete the property for cleanliness.
        scriptProperties.deleteProperty('SYNC_LOCK');
      }
    }
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