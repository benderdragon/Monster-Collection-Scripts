<a name="updateMonsterLinks"></a>

## updateMonsterLinks()
Updates the hyperlinks in column E of the 'Collection' sheet to point to thespecific cell of the monster in its corresponding location sheet.This function reads monster names from 'Collection!B' and their associated sheetlinks from 'Collection!E'. It then finds the matching monster name in the targetsheet and updates the hyperlink to point directly to the monster's cell (e.g., 'Elites'!B25).The script normalizes names to ensure matches, collapsing all whitespace (includingnewlines) into a single space for comparison. This handles variations like "Prefix Name"vs. "Prefix\nName". All original rich text formatting in the cell is preserved.Progress is logged to the Apps Script execution log.

**Kind**: global function  
