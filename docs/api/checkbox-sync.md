## Functions

<dl>
<dt><a href="#shouldSkipCell_">shouldSkipCell_(hasFormula, monsterName)</a> ⇒ <code>boolean</code></dt>
<dd><p>Determines if a cell should be skipped during synchronization.</p>
</dd>
<dt><a href="#readTargetSheetData_">readTargetSheetData_(sheet)</a> ⇒ <code>object</code> | <code>null</code></dt>
<dd><p>Reads target sheet data including values, formulas, and names.</p>
</dd>
<dt><a href="#findUpdatesForSheet_">findUpdatesForSheet_(sheetData, sourceDataMap)</a> ⇒ <code><a href="#UpdateObject">Array.&lt;UpdateObject&gt;</a></code></dt>
<dd><p>Finds updates needed for a target sheet by comparing with source data.</p>
</dd>
<dt><a href="#groupUpdatesIntoBatches_">groupUpdatesIntoBatches_(updatesToApply)</a> ⇒ <code><a href="#BatchObject">Array.&lt;BatchObject&gt;</a></code></dt>
<dd><p>Creates batches of contiguous row updates to be applied.</p>
</dd>
<dt><a href="#applyBatchesToSheet_">applyBatchesToSheet_(sheet, updates, sheetName)</a></dt>
<dd><p>Applies batched updates to a target sheet.</p>
</dd>
<dt><a href="#syncAllSheets_">syncAllSheets_(sourceDataMap, originatingSheetName)</a></dt>
<dd><p>Syncs all configured sheets to match the state provided in the sourceDataMap.
Uses batch operations to read and write data for maximum performance, skipping formulas.</p>
</dd>
<dt><a href="#validateEditEvent_">validateEditEvent_(event)</a> ⇒ <code>Object</code> | <code>Object</code></dt>
<dd><p>Validates if the edit event should trigger synchronization.</p>
</dd>
<dt><a href="#extractMonsterDataFromSheet_">extractMonsterDataFromSheet_(sheet)</a> ⇒ <code>Map.&lt;string, boolean&gt;</code> | <code>null</code></dt>
<dd><p>Reads and processes monster data from the source sheet into a normalized map.</p>
</dd>
<dt><a href="#onEdit">onEdit(event)</a></dt>
<dd><p>The main trigger function that runs automatically when a user edits the spreadsheet.
It reads the entire state of the edited sheet and triggers a full synchronization.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#UpdateObject">UpdateObject</a> : <code>object</code></dt>
<dd><p>An object representing a single cell update.</p>
</dd>
<dt><a href="#BatchObject">BatchObject</a> : <code>object</code></dt>
<dd><p>An object representing a contiguous block of updates.</p>
</dd>
</dl>

<a name="shouldSkipCell_"></a>

## shouldSkipCell\_(hasFormula, monsterName) ⇒ <code>boolean</code>
Determines if a cell should be skipped during synchronization.

**Kind**: global function  
**Returns**: <code>boolean</code> - True if the cell should be skipped.  

| Param | Type | Description |
| --- | --- | --- |
| hasFormula | <code>boolean</code> | Whether the cell contains a formula. |
| monsterName | <code>string</code> | The monster name from the row. |

<a name="readTargetSheetData_"></a>

## readTargetSheetData\_(sheet) ⇒ <code>object</code> \| <code>null</code>
Reads target sheet data including values, formulas, and names.

**Kind**: global function  
**Returns**: <code>object</code> \| <code>null</code> - Object containing targetData and targetFormulas, or null if empty.  

| Param | Type | Description |
| --- | --- | --- |
| sheet | <code>GoogleAppsScript.Spreadsheet.Sheet</code> | The sheet to read from. |

<a name="findUpdatesForSheet_"></a>

## findUpdatesForSheet\_(sheetData, sourceDataMap) ⇒ [<code>Array.&lt;UpdateObject&gt;</code>](#UpdateObject)
Finds updates needed for a target sheet by comparing with source data.

**Kind**: global function  
**Returns**: [<code>Array.&lt;UpdateObject&gt;</code>](#UpdateObject) - Array of updates to apply.  

| Param | Type | Description |
| --- | --- | --- |
| sheetData | <code>object</code> | Object containing targetData and targetFormulas arrays. |
| sourceDataMap | <code>Map.&lt;string, boolean&gt;</code> | Map of normalized monster names to checkbox states. |

<a name="groupUpdatesIntoBatches_"></a>

## groupUpdatesIntoBatches\_(updatesToApply) ⇒ [<code>Array.&lt;BatchObject&gt;</code>](#BatchObject)
Creates batches of contiguous row updates to be applied.

**Kind**: global function  
**Returns**: [<code>Array.&lt;BatchObject&gt;</code>](#BatchObject) - An array of batch objects, each with a startRow and a values array.  

| Param | Type | Description |
| --- | --- | --- |
| updatesToApply | [<code>Array.&lt;UpdateObject&gt;</code>](#UpdateObject) | An array of objects, each with a rowIndex and a newValue. |

<a name="applyBatchesToSheet_"></a>

## applyBatchesToSheet\_(sheet, updates, sheetName)
Applies batched updates to a target sheet.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| sheet | <code>GoogleAppsScript.Spreadsheet.Sheet</code> | The sheet to update. |
| updates | [<code>Array.&lt;UpdateObject&gt;</code>](#UpdateObject) | Array of updates to apply. |
| sheetName | <code>string</code> | Name of the sheet for logging purposes. |

<a name="syncAllSheets_"></a>

## syncAllSheets\_(sourceDataMap, originatingSheetName)
Syncs all configured sheets to match the state provided in the sourceDataMap.
Uses batch operations to read and write data for maximum performance, skipping formulas.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| sourceDataMap | <code>Map.&lt;string, boolean&gt;</code> | A map of normalized monster names to their checkbox state. |
| originatingSheetName | <code>string</code> | The name of the sheet the data came from, which will be skipped. |

<a name="validateEditEvent_"></a>

## validateEditEvent\_(event) ⇒ <code>Object</code> \| <code>Object</code>
Validates if the edit event should trigger synchronization.

**Kind**: global function  
**Returns**: <code>Object</code> \| <code>Object</code> - Validation result with sheet info.  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>object</code> | The event object from onEdit trigger. |

<a name="extractMonsterDataFromSheet_"></a>

## extractMonsterDataFromSheet\_(sheet) ⇒ <code>Map.&lt;string, boolean&gt;</code> \| <code>null</code>
Reads and processes monster data from the source sheet into a normalized map.

**Kind**: global function  
**Returns**: <code>Map.&lt;string, boolean&gt;</code> \| <code>null</code> - Map of normalized monster names to checkbox states, or null if no data.  

| Param | Type | Description |
| --- | --- | --- |
| sheet | <code>GoogleAppsScript.Spreadsheet.Sheet</code> | The sheet to read data from. |

<a name="onEdit"></a>

## onEdit(event)
The main trigger function that runs automatically when a user edits the spreadsheet.
It reads the entire state of the edited sheet and triggers a full synchronization.

**Kind**: global function  
**See**: https://developers.google.com/apps-script/guides/triggers/events  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>object</code> | The event object passed by the onEdit trigger. |

<a name="UpdateObject"></a>

## UpdateObject : <code>object</code>
An object representing a single cell update.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| rowIndex | <code>number</code> | The 1-based index of the row to update. |
| newValue | <code>boolean</code> | The new boolean value for the checkbox. |

<a name="BatchObject"></a>

## BatchObject : <code>object</code>
An object representing a contiguous block of updates.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| startRow | <code>number</code> | The 1-based index of the first row in the batch. |
| values | <code>Array.&lt;Array.&lt;boolean&gt;&gt;</code> | A 2D array of checkbox values to be written. |

