/**
 * @file This script synchronizes checkboxes across multiple sheets in a Google Sheet.
 * It's designed for a "Monster Collection" tracker where a monster may appear on a master
 * list ("Collection") and several other informational sheets. When a checkbox for a monster
 * is checked or unchecked on any configured sheet, this script finds all other instances
* of that monster and updates their checkboxes to match.
 */

// --- CONFIGURATION ---
// IMPORTANT: Adjust this section to match your spreadsheet's layout.
// - sheetName: The exact name of the sheet tab.
// - checkboxCol: The column number of the checkboxes (A=1, B=2, C=3, etc.).
// - nameCol: The column number where the monster's name is located.
const CONFIG = {
  // The 'master' sheet is the main collection log.
  masterSheet: {
    sheetName: "Collection",
    checkboxCol: 1, // Assumed Column A
    nameCol: 2,     // Assumed Column B contains the monster name
  },
  // 'syncSheets' are all other sheets that should be linked. Add more sheets here as needed.
  syncSheets: [
    {
      sheetName: "All Mobs & Locations",
      checkboxCol: 2, // GUESS: Assuming checkboxes are in Col B
      nameCol: 3,     // GUESS: Assuming monster names are in Col C
    },
    {
      sheetName: "Next Easiest Field Mobs",
      checkboxCol: 1, // GUESS: Assuming checkboxes are in Col A
      nameCol: 2,     // GUESS: Assuming monster names are in Col B
    },
    // Add another sheet configuration here if needed, like this:
    // {
    //   sheetName: "Another Sheet",
    //   checkboxCol: 4, // Column D
    //   nameCol: 5,     // Column E
    // }
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
    const sheetName = sheet.getName();
    const row = range.getRow();
    const col = range.getColumn();
    
    // Exit if the edit was not on a single cell or if it was not a checkbox value.
    if (range.getNumRows() > 1 || range.getNumColumns() > 1) return;
    if (e.value !== "TRUE" && e.value !== "FALSE") return;
    
    // Determine if the edited cell is one of the configured checkboxes.
    let monsterName;
    let nameCol;
    const isChecked = e.value === "TRUE";

    if (sheetName === CONFIG.masterSheet.sheetName && col === CONFIG.masterSheet.checkboxCol) {
      nameCol = CONFIG.masterSheet.nameCol;
    } else {
      const syncConfig = CONFIG.syncSheets.find(s => s.sheetName === sheetName && s.checkboxCol === col);
      if (syncConfig) {
        nameCol = syncConfig.nameCol;
      } else {
        return; // Edit was not in a configured checkbox column on any relevant sheet.
      }
    }
    
    // Get the monster name from the corresponding name column in the edited row.
    monsterName = sheet.getRange(row, nameCol).getValue();
    if (!monsterName) return; // Exit if the name cell is blank.

    // Set the lock, then perform the synchronization.
    PropertiesService.getScriptProperties().setProperty('SYNC_LOCK', 'true', 30000); // Lock expires in 30s
    syncAllCheckboxes(monsterName, isChecked, sheetName);

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
 * their checkbox state.
 *
 * @param {string} monsterName The name of the monster to search for.
 * @param {boolean} isChecked The new state for the checkbox (true for checked, false for unchecked).
 * @param {string} originatingSheetName The name of the sheet where the edit was made, to avoid updating it unnecessarily.
 */
function syncAllCheckboxes(monsterName, isChecked, originatingSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const allSheetConfigs = [CONFIG.masterSheet, ...CONFIG.syncSheets];

  allSheetConfigs.forEach(config => {
    // Skip the sheet where the original edit happened.
    if (config.sheetName === originatingSheetName) {
      return;
    }
    
    const sheet = ss.getSheetByName(config.sheetName);
    if (!sheet) return;

    // Use TextFinder for an efficient search of the monster name in the correct column.
    const searchRange = sheet.getRange(1, config.nameCol, sheet.getLastRow());
    const textFinder = searchRange.createTextFinder(monsterName).matchEntireCell(true).matchCase(false);
    const foundRanges = textFinder.findAll();

    // If any matches are found, update the checkbox in the corresponding row.
    if (foundRanges.length > 0) {
      foundRanges.forEach(foundRange => {
        const targetRow = foundRange.getRow();
        const checkboxCell = sheet.getRange(targetRow, config.checkboxCol);
        // Only update if the value is different to avoid unnecessary edits.
        if (checkboxCell.isChecked() !== isChecked) {
            checkboxCell.setValue(isChecked);
        }
      });
    }
  });
}