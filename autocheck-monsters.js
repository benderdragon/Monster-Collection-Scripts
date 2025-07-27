/**
 * @OnlyCurrentDoc
 * @file This script synchronizes checkboxes across multiple sheets in the active Google Sheet.
 * It's designed for a "Monster Collection" tracker. It assumes that on all relevant sheets,
 * checkboxes are in Column A and the corresponding monster name is in Column B. When a
 * checkbox is changed, this script finds all other instances of that monster on other
 * configured sheets and updates their checkboxes to match.
 */

// --- CONFIGURATION ---
// IMPORTANT: Add the names of all sheets you want to synchronize into this list.
// The script assumes for ALL these sheets:
// - Column A contains the checkboxes.
// - Column B contains the monster names.
const CONFIG = {
  syncSheetNames: [
    "Collection",
    "All Mobs & Locations",
    "Next Easiest Field Mobs"
    // Add other sheet names here, for example: "My Custom Sheet"
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
    if (range.getNumRows() > 1 || range.getNumColumns() > 1) return;
    if (e.value !== "TRUE" && e.value !== "FALSE") return;
    if (range.getColumn() !== CHECKBOX_COL || !CONFIG.syncSheetNames.includes(sheet.getName())) {
      return;
    }

    // Get the monster name from Column B in the edited row.
    const monsterName = sheet.getRange(range.getRow(), NAME_COL).getValue();
    if (!monsterName) return; // Exit if the name cell is blank.

    const isChecked = e.value === "TRUE";
    const originatingSheetName = sheet.getName();

    // Set the lock, then perform the synchronization.
    PropertiesService.getScriptProperties().setProperty('SYNC_LOCK', 'true', 30000); // Lock expires in 30s
    syncAllCheckboxes(monsterName, isChecked, originatingSheetName);

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
 * their checkbox state to match.
 *
 * @param {string} monsterName The name of the monster to search for.
 * @param {boolean} isChecked The new state for the checkbox (true for checked, false for unchecked).
 * @param {string} originatingSheetName The name of the sheet where the edit was made, to avoid updating it unnecessarily.
 */
function syncAllCheckboxes(monsterName, isChecked, originatingSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const CHECKBOX_COL = 1; // Column A
  const NAME_COL = 2;     // Column B

  CONFIG.syncSheetNames.forEach(sheetName => {
    // Skip the sheet where the original edit happened.
    if (sheetName === originatingSheetName) {
      return;
    }
    
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    // Use TextFinder for an efficient search of the monster name in Column B.
    const searchRange = sheet.getRange(1, NAME_COL, sheet.getLastRow());
    const textFinder = searchRange.createTextFinder(monsterName).matchEntireCell(true).matchCase(false);
    const foundRanges = textFinder.findAll();

    // If any matches are found, update the checkbox in Column A of the corresponding row.
    if (foundRanges.length > 0) {
      foundRanges.forEach(foundRange => {
        const targetRow = foundRange.getRow();
        const checkboxCell = sheet.getRange(targetRow, CHECKBOX_COL);
        // Only update if the value is different to avoid unnecessary edits.
        if (checkboxCell.isChecked() !== isChecked) {
            checkboxCell.setValue(isChecked);
        }
      });
    }
  });
}