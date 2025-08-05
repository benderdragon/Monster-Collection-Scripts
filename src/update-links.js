/**
 * @OnlyCurrentDoc
 */

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
  console.log('Starting monster link update process...');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const collectionSheet = ss.getSheetByName('Collection');

  if (!collectionSheet) {
    console.log('Error: Sheet "Collection" not found. Aborting.');
    return;
  }

  // Create a map of Sheet GID -> Sheet Name for quick lookup.
  const gidMap = ss.getSheets().reduce((map, sheet) => {
    map[sheet.getSheetId()] = sheet.getName();
    return map;
  }, {});

  // Cache for target sheet data to avoid re-reading for same sheet.
  const sheetDataCache = {};

  const lastRow = collectionSheet.getLastRow();
  if (lastRow < 2) {
    console.log('No data found in "Collection" sheet. Exiting.');
    return;
  }
  console.log(`Processing ${lastRow - 1} rows from 'Collection' sheet.`);

  const linkRange = collectionSheet.getRange('E2:E' + lastRow);
  const linkRichTextValues = linkRange.getRichTextValues();

  // We need the names from column B for matching.
  const collectionNames = collectionSheet.getRange('B2:B' + lastRow).getValues();

  let updatedLinksCount = 0;

  for (let i = 0; i < linkRichTextValues.length; i++) {
    const cellRichText = linkRichTextValues[i][0];
    const linkUrl = cellRichText.getLinkUrl();
    const monsterNameToFind = collectionNames[i][0];

    // Proceed only if there is a monster name and a valid sheet link
    if (linkUrl?.startsWith('#gid=') && monsterNameToFind) {
      const gidMatch = linkUrl.match(/#gid=(\d+)/);
      if (gidMatch) {
        const gid = gidMatch[1];
        const targetSheetName = gidMap[gid];

        if (targetSheetName) {
          let targetNames;
          // Use cache or read and cache the target sheet data
          if (!sheetDataCache.hasOwnProperty(targetSheetName)) {
            const targetSheet = ss.getSheetByName(targetSheetName);
            console.log(`Reading monster names from sheet: '${targetSheetName}'...`);
            if (targetSheet) {
              const lastTargetRow = targetSheet.getLastRow();
              if (lastTargetRow > 0) {
                sheetDataCache[targetSheetName] = targetSheet.getRange(1, 2, lastTargetRow, 1).getValues();
              } else {
                sheetDataCache[targetSheetName] = []; // Cache empty result
              }
            } else {
              console.log(`Warning: Target sheet '${targetSheetName}' not found.`);
              sheetDataCache[targetSheetName] = null; // Cache null result
            }
          }
          targetNames = sheetDataCache[targetSheetName];

          if (targetNames) {
            const normalizedSource = monsterNameToFind.toString().trim().replace(/\s+/g, ' ').toLowerCase();
            let targetRow = -1;

            // Find the monster in the target sheet's list
            for (let j = 0; j < targetNames.length; j++) {
              const currentTargetName = targetNames[j][0];
              if (currentTargetName) { // Check for non-empty cell
                const normalizedTarget = currentTargetName.toString().trim().replace(/\s+/g, ' ').toLowerCase();
                if (normalizedTarget === normalizedSource) {
                  targetRow = j + 1; // 1-based index for getRange
                  break;
                }
              }
            }

            if (targetRow !== -1) {
              const text = cellRichText.getText();
              const runs = cellRichText.getRuns();

              // Build a new RichTextValue to preserve all formatting.
              const newLinkBuilder = SpreadsheetApp.newRichTextValue().setText(text);

              // Re-apply all formatting runs from the original cell.
              for (const run of runs) {
                newLinkBuilder.setTextStyle(run.getStartIndex(), run.getEndIndex(), run.getTextStyle());
              }

              // Set the new, more specific link URL for the entire cell text.
              const newUrl = `#gid=${gid}&range=B${targetRow}`;
              newLinkBuilder.setLinkUrl(0, text.length, newUrl);

              // Overwrite the old RichTextValue in our array.
              linkRichTextValues[i][0] = newLinkBuilder.build();
              updatedLinksCount++;
            }
          }
        }
      }
    }
  }

  // Write the updated rich text values back to the sheet in one operation.
  if (updatedLinksCount > 0) {
    console.log(`Writing ${updatedLinksCount} updated links back to the sheet.`);
    linkRange.setRichTextValues(linkRichTextValues);
  }

  console.log(`Processing complete. ${updatedLinksCount} links updated.`);
}