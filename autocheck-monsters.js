/**
 * @OnlyCurrentDoc
 * @file This script synchronizes checkboxes across multiple sheets in the active Google Sheet.
 * It's designed for a "Monster Collection" tracker. It assumes that on all relevant sheets,
 * checkboxes are in Column A and the corresponding monster name is in Column B. When a
 * checkbox is changed, this script finds all other instances of that monster on other
 * configured sheets and updates their checkboxes to match. It handles multi-line monster
 * names by normalizing them before comparison.
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
 * It identifies if a relevant checkbox was edited and initiates the synchronization.
 *
 * @param {Object} e The event object passed by the onEdit trigger.
 * @see https://developers.google.com/apps-script/guides/triggers/events
 */
function onEdit(e) {
  // Use a lock to prevent the script from triggering itself and causing an infinite loop.
  const lock = PropertiesService.getScriptProperties().getProperty('SYNC_LOCK');
  if (lock) {
    return;
  }
  
  try {
    const range = e.range;
    const sheet = range.getSheet();
    const CHECKBOX_COL = 1; // Column A
    const NAME_COL = 2;     // Column B

    // Exit if the edit was not a single checkbox in a configured sheet's checkbox column.
    if (range.getNumRows() > 1 || range.getNumColumns() > 1) {
      return;
    }
    if (e.value !== "TRUE" && e.value !== "FALSE") {
      return;
    }
    if (range.getColumn() !== CHECKBOX_COL || !CONFIG.syncSheetNames.includes(sheet.getName())) {
      return;
    }

    // Get the monster name from Column B, converting it to a string.
    const monsterName = sheet.getRange(range.getRow(), NAME_COL).getValue().toString();
    // Exit if the name cell is effectively blank.
    if (!monsterName || !monsterName.trim()) {
      return;
    }

    // Normalize the name by replacing any whitespace sequence (incl. newlines) with a single space.
    const normalizedMonsterName = monsterName.replace(/\s+/g, ' ').trim();
    const isChecked = e.value === "TRUE";
    const originatingSheetName = sheet.getName();

    // Set the lock, then perform the synchronization.
    PropertiesService.getScriptProperties().setProperty('SYNC_LOCK', 'true', 30000); // Lock expires in 30s
    syncAllCheckboxes(normalizedMonsterName, isChecked, originatingSheetName);

  } catch (error) {
    // Log any errors to help with debugging.
    console.error(`An error occurred in onEdit: ${error.toString()}`);
  } finally {
    // ALWAYS release the lock, even if an error occurs.
    PropertiesService.getScriptProperties().deleteProperty('SYNC_LOCK');
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