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
<dt><a href="#BatchObject">BatchObject</a> : <code>Object</code></dt>
<dd><p>This script synchronizes checkboxes across multiple sheets in the active Google Sheet.
It&#39;s designed for a &quot;Monster Collection&quot; tracker. It also provides a developer utility
to convert checkbox columns from formulas to boolean values, which is intended to be
run manually from the Apps Script editor.</p>
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
| updatesToApply | <code>Array.&lt;UpdateObject&gt;</code> | An array of objects, each with a rowIndex and a newValue. |

<a name="syncAllSheets"></a>

## syncAllSheets(sourceDataMap, originatingSheetName)
Syncs all configured sheets to match the state provided in the sourceDataMap.Uses batch operations to read and write data for maximum performance, skipping formulas.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| sourceDataMap | <code>Map.&lt;string, boolean&gt;</code> | A map of normalized monster names to their checkbox state. |
| originatingSheetName | <code>string</code> | The name of the sheet the data came from, which will be skipped. |

<a name="updateMonsterLinks"></a>

## updateMonsterLinks()
Updates the hyperlinks in column E of the 'Collection' sheet to point to thespecific cell of the monster in its corresponding location sheet.This function reads monster names from 'Collection!B' and their associated sheetlinks from 'Collection!E'. It then finds the matching monster name in the targetsheet and updates the hyperlink to point directly to the monster's cell (e.g., 'Elites'!B25).The script normalizes names to ensure matches, collapsing all whitespace (includingnewlines) into a single space for comparison. This handles variations like "Prefix Name"vs. "Prefix\nName". All original rich text formatting in the cell is preserved.Progress is logged to the Apps Script execution log.

**Kind**: global function  
<a name="BatchObject"></a>

## BatchObject : <code>Object</code>
This script synchronizes checkboxes across multiple sheets in the active Google Sheet.It's designed for a "Monster Collection" tracker. It also provides a developer utilityto convert checkbox columns from formulas to boolean values, which is intended to berun manually from the Apps Script editor.

**Kind**: global typedef  
**Onlycurrentdoc**:   
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| rowIndex | <code>number</code> | The 1-based index of the row to update. |
| newValue | <code>boolean</code> | The new boolean value for the checkbox. |
| startRow | <code>number</code> | The 1-based index of the first row in the batch. |
| values | <code>Array.&lt;Array.&lt;boolean&gt;&gt;</code> | A 2D array of checkbox values to be written. |

