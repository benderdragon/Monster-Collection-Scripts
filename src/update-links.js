"use strict";

/**
 * @OnlyCurrentDoc
 */

/* exported updateMonsterLinks */

/**
 * @typedef {object} GidToSheetMap
 * @property {string} [gid] Sheet name corresponding to the GID key.
 */

/**
 * @typedef {object} SheetDataCache
 * @property {Array<Array<string>>|null} [sheetName] Cached monster names from the sheet, or null if sheet not found.
 */

/**
 * @typedef {object} LinkProcessingContext
 * @property {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet The active spreadsheet instance.
 * @property {GidToSheetMap} gidMap Mapping of sheet GIDs to sheet names.
 * @property {SheetDataCache} sheetDataCache Cache for storing sheet data to avoid re-reading.
 */

/**
 * @typedef {object} LinkProcessingSetup
 * @property {GoogleAppsScript.Spreadsheet.Sheet} collectionSheet The Collection sheet.
 * @property {LinkProcessingContext} context The processing context.
 * @property {number} lastRow The last row with data in the Collection sheet.
 */

/**
 * @typedef {object} LinkProcessingResults
 * @property {Array<Array<GoogleAppsScript.Spreadsheet.RichTextValue>>} updatedValues The updated rich text values.
 * @property {number} updatedCount The number of links that were updated.
 */

/**
 * Creates a mapping of GID to sheet name for all sheets in the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet The active spreadsheet
 * @returns {GidToSheetMap} Map of GID to sheet name
 */
function createGidMap_(spreadsheet) {
  // Get all sheets and create a map from GID to sheet name
  const sheets = spreadsheet.getSheets();
  const gidMap = {};

  for (const sheet of sheets) {
    gidMap[sheet.getSheetId()] = sheet.getName();
  }

  return gidMap;
}

/**
 * Reads and caches monster names from a target sheet.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet The active spreadsheet
 * @param {string} sheetName Name of the sheet to read from
 * @param {SheetDataCache} cache Cache object to store results
 * @returns {Array<Array<string>>|null} Array of monster names or null if sheet not found
 */
function cacheSheetData_(spreadsheet, sheetName, cache) {
  // Return cached data if already processed
  if (Object.hasOwn(cache, sheetName)) {
    return cache[sheetName];
  }

  console.log(`Reading monster names from sheet: '${sheetName}'...`);
  const targetSheet = spreadsheet.getSheetByName(sheetName);

  if (!targetSheet) {
    console.log(`Warning: Target sheet '${sheetName}' not found.`);
    cache[sheetName] = null;
    return null;
  }

  const lastTargetRow = targetSheet.getLastRow();
  if (lastTargetRow > 0) {
    // Read column B (Column 2) from all rows with data
    const columnIndex = 2;
    cache[sheetName] = targetSheet
      .getRange(1, columnIndex, lastTargetRow, 1)
      .getValues();
  } else {
    // Cache empty result for sheets with no data
    cache[sheetName] = [];
  }

  return cache[sheetName];
}

/**
 * Normalizes a monster name by trimming and collapsing whitespace.
 * @param {string} name The name to normalize
 * @returns {string} Normalized name in lowercase
 */
function normalizeName_(name) {
  return name.toString().trim().replace(/\s+/gv, " ").toLowerCase();
}

/**
 * Finds the row number of a monster in the target sheet data.
 * @param {string} monsterName Name of the monster to find
 * @param {Array<Array<string>>} targetNames Array of monster names from target sheet
 * @returns {number} 1-based row number, or -1 if not found
 */
function findMonsterRow_(monsterName, targetNames) {
  const normalizedSource = normalizeName_(monsterName);

  for (let row = 0; row < targetNames.length; row++) {
    const currentTargetName = targetNames[row][0];
    if (
      currentTargetName &&
      normalizeName_(currentTargetName) === normalizedSource
    ) {
      // Convert to 1-based index for Google Sheets
      return row + 1;
    }
  }

  return -1;
}

/**
 * Creates a new RichTextValue with updated hyperlink while preserving formatting.
 * @param {GoogleAppsScript.Spreadsheet.RichTextValue} originalRichText Original rich text
 * @param {string} gid Sheet GID for the new URL
 * @param {number} targetRow Target row number for the new URL
 * @returns {GoogleAppsScript.Spreadsheet.RichTextValue} Updated rich text value
 */
function createUpdatedRichText_(originalRichText, gid, targetRow) {
  const text = originalRichText.getText();
  const runs = originalRichText.getRuns();

  // Create a new rich text builder with the same text content
  const newLinkBuilder = SpreadsheetApp.newRichTextValue().setText(text);

  // Preserve all existing formatting runs from the original cell
  for (const run of runs) {
    newLinkBuilder.setTextStyle(
      run.getStartIndex(),
      run.getEndIndex(),
      run.getTextStyle()
    );
  }

  // Update the hyperlink URL to point to the specific cell
  const newUrl = `#gid=${gid}&range=B${targetRow}`;
  newLinkBuilder.setLinkUrl(0, text.length, newUrl);

  return newLinkBuilder.build();
}

/**
 * Processes a single link cell and updates it if a matching monster is found.
 * @param {GoogleAppsScript.Spreadsheet.RichTextValue} cellRichText Rich text from the cell
 * @param {string} monsterName Name of the monster to find
 * @param {LinkProcessingContext} context Processing context containing spreadsheet, maps, and cache
 * @returns {GoogleAppsScript.Spreadsheet.RichTextValue|null} Updated rich text or null if no update needed
 */
function processLinkCell_(cellRichText, monsterName, context) {
  const linkUrl = cellRichText.getLinkUrl();

  // Skip cells that don't have valid sheet links or monster names
  if (!linkUrl?.startsWith("#gid=") || !monsterName) {
    return null;
  }

  const gidMatch = linkUrl.match(/#gid=(?<gid>\d+)/v);
  // Skip cells with malformed GID patterns
  if (!gidMatch) {
    return null;
  }

  const gid = gidMatch.groups.gid;
  const targetSheetName = context.gidMap[gid];

  // Skip cells linking to sheets that don't exist
  if (!targetSheetName) {
    return null;
  }

  const targetNames = cacheSheetData_(
    context.spreadsheet,
    targetSheetName,
    context.sheetDataCache
  );
  // Skip cells linking to sheets that couldn't be read
  if (!targetNames) {
    return null;
  }

  const targetRow = findMonsterRow_(monsterName, targetNames);
  if (targetRow >= 1) {
    return createUpdatedRichText_(cellRichText, gid, targetRow);
  }

  // Skip cells where the monster wasn't found in the target sheet
  return null;
}

/**
 * Prepares the link processing by validating the Collection sheet and setting up required data structures.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet The active spreadsheet
 * @returns {LinkProcessingSetup|null} Processing setup object or null if setup failed
 */
function prepareLinkProcessing_(spreadsheet) {
  const collectionSheet = spreadsheet.getSheetByName("Collection");

  if (!collectionSheet) {
    console.log('Error: Sheet "Collection" not found. Aborting.');
    return null;
  }

  // Create processing context with maps and cache for efficient data access
  const context = {
    spreadsheet,
    gidMap: createGidMap_(spreadsheet),
    sheetDataCache: {},
  };

  const lastRow = collectionSheet.getLastRow();
  const minDataRow = 2;
  if (lastRow < minDataRow) {
    console.log('No data found in "Collection" sheet. Exiting.');
    return null;
  }

  return {
    collectionSheet,
    context,
    lastRow,
  };
}

/**
 * Processes all link cells to check for updates and modify them if needed.
 * @param {GoogleAppsScript.Spreadsheet.Range} linkRange The range containing link cells
 * @param {Array<Array<string>>} collectionNames The monster names from Collection sheet
 * @param {LinkProcessingContext} context The processing context
 * @returns {LinkProcessingResults} Processing results containing updated values and count
 */
function processAllLinks_(linkRange, collectionNames, context) {
  const linkRichTextValues = linkRange.getRichTextValues();
  let updatedLinksCount = 0;

  // Process each link cell to check for updates
  for (let idx = 0; idx < linkRichTextValues.length; idx++) {
    const cellRichText = linkRichTextValues[idx][0];
    const monsterNameToFind = collectionNames[idx][0];

    const updatedRichText = processLinkCell_(
      cellRichText,
      monsterNameToFind,
      context
    );

    if (updatedRichText) {
      linkRichTextValues[idx][0] = updatedRichText;
      updatedLinksCount++;
    }
  }

  return {
    updatedValues: linkRichTextValues,
    updatedCount: updatedLinksCount,
  };
}

/**
 * Writes the updated link values back to the sheet if any changes were made.
 * @param {GoogleAppsScript.Spreadsheet.Range} linkRange The range to write updated values to
 * @param {Array<Array<GoogleAppsScript.Spreadsheet.RichTextValue>>} updatedValues The updated rich text values
 * @param {number} updatedCount The number of links that were updated
 */
function writeLinkUpdates_(linkRange, updatedValues, updatedCount) {
  // Write all updated links back to the sheet in a single batch operation
  if (updatedCount > 0) {
    console.log(`Writing ${updatedCount} updated links back to the sheet.`);
    linkRange.setRichTextValues(updatedValues);
  }
}

/**
 * Updates the hyperlinks in column E of the 'Collection' sheet to point to the
 * specific cell of the monster in its corresponding location sheet.
 *
 * This function reads monster names from 'Collection!B' and their associated sheet
 * links from 'Collection!E'. It then finds the matching monster name in the target
 * sheet and updates the hyperlink to point directly to the monster's cell (e.g., 'Elites'!B25).
 *
 * The script normalizes names to ensure matches, collapsing all whitespace (including
 * newlines) into a single space for comparison. This handles variations like "Prefix Name"
 * vs. "Prefix\nName". All original rich text formatting in the cell is preserved.
 *
 * Progress is logged to the Apps Script execution log.
 */
function updateMonsterLinks() {
  console.log("Starting monster link update process...");
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Prepare processing environment and validate prerequisites
  const setupData = prepareLinkProcessing_(ss);
  if (!setupData) {
    return;
  }

  const { collectionSheet, context, lastRow } = setupData;
  const minDataRow = 2;
  console.log(`Processing ${lastRow - 1} rows from 'Collection' sheet.`);

  // Get all the data we need in batch operations for performance
  const linkRange = collectionSheet.getRange(`E${minDataRow}:E${lastRow}`);
  const collectionNames = collectionSheet
    .getRange(`B${minDataRow}:B${lastRow}`)
    .getValues();

  // Process all links and collect updates
  const { updatedValues, updatedCount } = processAllLinks_(
    linkRange,
    collectionNames,
    context
  );

  // Write results back to the sheet
  writeLinkUpdates_(linkRange, updatedValues, updatedCount);

  console.log(`Processing complete. ${updatedCount} links updated.`);
}
