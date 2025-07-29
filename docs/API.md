## Functions

<dl>
<dt><a href="#flattenCheckboxFormulas">flattenCheckboxFormulas()</a></dt>
<dd><p>A developer utility function that finds all cells in the checkbox column (A) that are
formatted as a checkbox, contain a formula, AND have a corresponding monster name in Column B.
It replaces these formulas with a default <code>FALSE</code> value, while preserving all other formulas.
This is intended to be run manually from the Apps Script Editor.</p>
</dd>
<dt><a href="#onEdit">onEdit(e)</a></dt>
<dd><p>The main trigger function that runs automatically when a user edits the spreadsheet.
It reads the entire state of the edited sheet and triggers a full synchronization.</p>
</dd>
<dt><a href="#groupUpdatesIntoBatches">groupUpdatesIntoBatches(updatesToApply)</a> ⇒ <code><a href="#BatchObject">Array.&lt;BatchObject&gt;</a></code></dt>
<dd><p>Creates batches of contiguous row updates to be applied.</p>
</dd>
<dt><a href="#syncAllSheets">syncAllSheets(sourceDataMap, originatingSheetName)</a></dt>
<dd><p>Syncs all configured sheets to match the state provided in the sourceDataMap.
Uses batch operations to read and write data for maximum performance, skipping formulas.</p>
</dd>
<dt><a href="#columnToLetter">columnToLetter(column)</a> ⇒ <code>string</code></dt>
<dd><p>Helper function to convert a 1-based column number to its A1 letter representation.
E.g., 1 -&gt; A, 2 -&gt; B, 27 -&gt; AA</p>
</dd>
<dt><a href="#parseA1">parseA1(a1Notation)</a> ⇒ <code>Object</code></dt>
<dd><p>Helper function to convert an A1 notation string (e.g., &quot;A1&quot;, &quot;C5&quot;, &quot;AA10&quot;)
into a 0-based row and column index object { row: number, col: number }.</p>
</dd>
<dt><a href="#isSupportedDateString">isSupportedDateString(str)</a> ⇒ <code>boolean</code></dt>
<dd><p>Helper function to check if a string is in a supported date format (ISO 8601 or MM/DD/YYYY).</p>
</dd>
<dt><a href="#tryParseDate">tryParseDate(value)</a> ⇒ <code>*</code></dt>
<dd><p>Helper function to attempt parsing a value into a Date object if it&#39;s a supported date string.
Otherwise, returns the original value.</p>
</dd>
<dt><a href="#exportCellContentAndFormulasOptimized">exportCellContentAndFormulasOptimized()</a></dt>
<dd><p>Exports all cell content (values and formulas) from the active Google Spreadsheet
to a JSON file in Google Drive. This script is optimized to minimize API calls.</p>
</dd>
<dt><a href="#importCellContentAndFormulasOptimized">importCellContentAndFormulasOptimized()</a></dt>
<dd><p>Imports cell content (values and formulas) into the active Google Spreadsheet
from a JSON file located in Google Drive. This script uses a two-phase approach
to correctly import formulas and their spilled results.</p>
</dd>
<dt><a href="#updateMonsterLinks">updateMonsterLinks()</a></dt>
<dd><p>Updates the hyperlinks in column E of the &#39;Collection&#39; sheet to point to the
specific cell of the monster in its corresponding location sheet.</p>
<p>This function reads monster names from &#39;Collection!B&#39; and their associated sheet
links from &#39;Collection!E&#39;. It then finds the matching monster name in the target
sheet and updates the hyperlink to point directly to the monster&#39;s cell (e.g., &#39;Elites&#39;!B25).</p>
<p>The script normalizes names to ensure matches, collapsing all whitespace (including
newlines) into a single space for comparison. This handles variations like &quot;Prefix Name&quot;
vs. &quot;Prefix\nName&quot;. All original rich text formatting in the cell is preserved.</p>
<p>Progress is logged to the Apps Script execution log.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#UpdateObject">UpdateObject</a> : <code>Object</code></dt>
<dd><p>An object representing a single cell update.</p>
</dd>
<dt><a href="#BatchObject">BatchObject</a> : <code>Object</code></dt>
<dd><p>An object representing a contiguous block of updates.</p>
</dd>
</dl>

<a name="flattenCheckboxFormulas"></a>

## flattenCheckboxFormulas()
A developer utility function that finds all cells in the checkbox column (A) that areformatted as a checkbox, contain a formula, AND have a corresponding monster name in Column B.It replaces these formulas with a default `FALSE` value, while preserving all other formulas.This is intended to be run manually from the Apps Script Editor.

**Kind**: global function  
<a name="onEdit"></a>

## onEdit(e)
The main trigger function that runs automatically when a user edits the spreadsheet.It reads the entire state of the edited sheet and triggers a full synchronization.

**Kind**: global function  
**See**: https://developers.google.com/apps-script/guides/triggers/events  

| Param | Type | Description |
| --- | --- | --- |
| e | <code>Object</code> | The event object passed by the onEdit trigger. |

<a name="groupUpdatesIntoBatches"></a>

## groupUpdatesIntoBatches(updatesToApply) ⇒ [<code>Array.&lt;BatchObject&gt;</code>](#BatchObject)
Creates batches of contiguous row updates to be applied.

**Kind**: global function  
**Returns**: [<code>Array.&lt;BatchObject&gt;</code>](#BatchObject) - An array of batch objects, each with a startRow and a values array.  

| Param | Type | Description |
| --- | --- | --- |
| updatesToApply | [<code>Array.&lt;UpdateObject&gt;</code>](#UpdateObject) | An array of objects, each with a rowIndex and a newValue. |

<a name="syncAllSheets"></a>

## syncAllSheets(sourceDataMap, originatingSheetName)
Syncs all configured sheets to match the state provided in the sourceDataMap.Uses batch operations to read and write data for maximum performance, skipping formulas.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| sourceDataMap | <code>Map.&lt;string, boolean&gt;</code> | A map of normalized monster names to their checkbox state. |
| originatingSheetName | <code>string</code> | The name of the sheet the data came from, which will be skipped. |

<a name="columnToLetter"></a>

## columnToLetter(column) ⇒ <code>string</code>
Helper function to convert a 1-based column number to its A1 letter representation.
E.g., 1 -> A, 2 -> B, 27 -> AA

**Kind**: global function  
**Returns**: <code>string</code> - The A1 letter representation.  

| Param | Type | Description |
| --- | --- | --- |
| column | <code>number</code> | The column number (1-indexed). |

<a name="parseA1"></a>

## parseA1(a1Notation) ⇒ <code>Object</code>
Helper function to convert an A1 notation string (e.g., "A1", "C5", "AA10")
into a 0-based row and column index object { row: number, col: number }.

**Kind**: global function  
**Returns**: <code>Object</code> - An object with 0-indexed row and column.  

| Param | Type | Description |
| --- | --- | --- |
| a1Notation | <code>string</code> | The cell's A1 notation. |

<a name="isSupportedDateString"></a>

## isSupportedDateString(str) ⇒ <code>boolean</code>
Helper function to check if a string is in a supported date format (ISO 8601 or MM/DD/YYYY).

**Kind**: global function  
**Returns**: <code>boolean</code> - True if the string matches a supported date format, false otherwise.  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>string</code> | The string to check. |

<a name="tryParseDate"></a>

## tryParseDate(value) ⇒ <code>\*</code>
Helper function to attempt parsing a value into a Date object if it's a supported date string.
Otherwise, returns the original value.

**Kind**: global function  
**Returns**: <code>\*</code> - A Date object if parsed, otherwise the original value.  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>\*</code> | The value to potentially parse. |

<a name="exportCellContentAndFormulasOptimized"></a>

## exportCellContentAndFormulasOptimized()
Exports all cell content (values and formulas) from the active Google Spreadsheet
to a JSON file in Google Drive. This script is optimized to minimize API calls.

**Kind**: global function  
<a name="importCellContentAndFormulasOptimized"></a>

## importCellContentAndFormulasOptimized()
Imports cell content (values and formulas) into the active Google Spreadsheet
from a JSON file located in Google Drive. This script uses a two-phase approach
to correctly import formulas and their spilled results.

**Kind**: global function  
<a name="updateMonsterLinks"></a>

## updateMonsterLinks()
Updates the hyperlinks in column E of the 'Collection' sheet to point to thespecific cell of the monster in its corresponding location sheet.This function reads monster names from 'Collection!B' and their associated sheetlinks from 'Collection!E'. It then finds the matching monster name in the targetsheet and updates the hyperlink to point directly to the monster's cell (e.g., 'Elites'!B25).The script normalizes names to ensure matches, collapsing all whitespace (includingnewlines) into a single space for comparison. This handles variations like "Prefix Name"vs. "Prefix\nName". All original rich text formatting in the cell is preserved.Progress is logged to the Apps Script execution log.

**Kind**: global function  
<a name="UpdateObject"></a>

## UpdateObject : <code>Object</code>
An object representing a single cell update.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| rowIndex | <code>number</code> | The 1-based index of the row to update. |
| newValue | <code>boolean</code> | The new boolean value for the checkbox. |

<a name="BatchObject"></a>

## BatchObject : <code>Object</code>
An object representing a contiguous block of updates.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| startRow | <code>number</code> | The 1-based index of the first row in the batch. |
| values | <code>Array.&lt;Array.&lt;boolean&gt;&gt;</code> | A 2D array of checkbox values to be written. |

