## Functions

<dl>
<dt><a href="#readSheetDataForFlattening_">readSheetDataForFlattening_(sheet)</a> ⇒ <code><a href="#SheetFlatteningData">SheetFlatteningData</a></code> | <code>null</code></dt>
<dd><p>Reads sheet data needed for formula flattening analysis.</p>
</dd>
<dt><a href="#shouldFlattenCell_">shouldFlattenCell_(hasFormula, isCheckbox, monsterName)</a> ⇒ <code>boolean</code></dt>
<dd><p>Determines if a cell should be flattened to FALSE.
A cell should be flattened if it&#39;s a checkbox with a formula on a row with a monster name.</p>
</dd>
<dt><a href="#processRowForFlattening_">processRowForFlattening_(sheetData, rowIndex)</a> ⇒ <code>Array</code></dt>
<dd><p>Processes a single row to determine what value should be written back.</p>
</dd>
<dt><a href="#buildFlattenedDataArray_">buildFlattenedDataArray_(sheetData)</a> ⇒ <code><a href="#FlatteningResult">FlatteningResult</a></code></dt>
<dd><p>Builds the data array to write back to the sheet and counts flattened formulas.</p>
</dd>
<dt><a href="#processSheetForFlattening_">processSheetForFlattening_(sheet, sheetName)</a> ⇒ <code>number</code></dt>
<dd><p>Processes a single sheet for formula flattening.</p>
</dd>
<dt><a href="#flattenCheckboxFormulas">flattenCheckboxFormulas()</a></dt>
<dd><p>A developer utility function that finds all cells in the checkbox column (A) that are
formatted as a checkbox, contain a formula, AND have a corresponding monster name in Column B.
It replaces these formulas with a default <code>FALSE</code> value, while preserving all other formulas.
This is intended to be run manually from the Apps Script Editor.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#SheetFlatteningData">SheetFlatteningData</a> : <code>object</code></dt>
<dd><p>Data structure containing all information needed for flattening analysis.</p>
</dd>
<dt><a href="#FlatteningResult">FlatteningResult</a> : <code>object</code></dt>
<dd><p>Result of building the flattened data array.</p>
</dd>
</dl>

<a name="readSheetDataForFlattening_"></a>

## readSheetDataForFlattening\_(sheet) ⇒ [<code>SheetFlatteningData</code>](#SheetFlatteningData) \| <code>null</code>
Reads sheet data needed for formula flattening analysis.

**Kind**: global function  
**Returns**: [<code>SheetFlatteningData</code>](#SheetFlatteningData) \| <code>null</code> - Object containing all necessary data arrays, or null if empty.  

| Param | Type | Description |
| --- | --- | --- |
| sheet | <code>GoogleAppsScript.Spreadsheet.Sheet</code> | The sheet to read from. |

<a name="shouldFlattenCell_"></a>

## shouldFlattenCell\_(hasFormula, isCheckbox, monsterName) ⇒ <code>boolean</code>
Determines if a cell should be flattened to FALSE.A cell should be flattened if it's a checkbox with a formula on a row with a monster name.

**Kind**: global function  
**Returns**: <code>boolean</code> - True if the cell should be flattened.  

| Param | Type | Description |
| --- | --- | --- |
| hasFormula | <code>boolean</code> | Whether the cell contains a formula. |
| isCheckbox | <code>boolean</code> | Whether the cell is formatted as a checkbox. |
| monsterName | <code>string</code> | The monster name from the row. |

<a name="processRowForFlattening_"></a>

## processRowForFlattening\_(sheetData, rowIndex) ⇒ <code>Array</code>
Processes a single row to determine what value should be written back.

**Kind**: global function  
**Returns**: <code>Array</code> - Single-element array containing the value to write.  

| Param | Type | Description |
| --- | --- | --- |
| sheetData | [<code>SheetFlatteningData</code>](#SheetFlatteningData) | Object containing all data for the sheet. |
| rowIndex | <code>number</code> | The zero-based index of the row. |

<a name="buildFlattenedDataArray_"></a>

## buildFlattenedDataArray\_(sheetData) ⇒ [<code>FlatteningResult</code>](#FlatteningResult)
Builds the data array to write back to the sheet and counts flattened formulas.

**Kind**: global function  
**Returns**: [<code>FlatteningResult</code>](#FlatteningResult) - Object with data array and count.  

| Param | Type | Description |
| --- | --- | --- |
| sheetData | [<code>SheetFlatteningData</code>](#SheetFlatteningData) | Object containing all data for the sheet. |

<a name="processSheetForFlattening_"></a>

## processSheetForFlattening\_(sheet, sheetName) ⇒ <code>number</code>
Processes a single sheet for formula flattening.

**Kind**: global function  
**Returns**: <code>number</code> - Number of formulas replaced in this sheet.  

| Param | Type | Description |
| --- | --- | --- |
| sheet | <code>GoogleAppsScript.Spreadsheet.Sheet</code> | The sheet to process. |
| sheetName | <code>string</code> | The name of the sheet for logging. |

<a name="flattenCheckboxFormulas"></a>

## flattenCheckboxFormulas()
A developer utility function that finds all cells in the checkbox column (A) that areformatted as a checkbox, contain a formula, AND have a corresponding monster name in Column B.It replaces these formulas with a default `FALSE` value, while preserving all other formulas.This is intended to be run manually from the Apps Script Editor.

**Kind**: global function  
<a name="SheetFlatteningData"></a>

## SheetFlatteningData : <code>object</code>
Data structure containing all information needed for flattening analysis.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| checkboxFormulas | <code>Array.&lt;Array.&lt;string&gt;&gt;</code> | 2D array of formulas from the checkbox column. |
| checkboxValues | <code>Array.&lt;Array.&lt;\*&gt;&gt;</code> | 2D array of values from the checkbox column. |
| checkboxValidations | <code>Array.&lt;Array.&lt;GoogleAppsScript.Spreadsheet.DataValidation&gt;&gt;</code> | 2D array of data validations. |
| nameValues | <code>Array.&lt;Array.&lt;\*&gt;&gt;</code> | 2D array of values from the monster name column. |
| lastRow | <code>number</code> | The last row number with data in the sheet. |
| checkboxColumnRange | <code>GoogleAppsScript.Spreadsheet.Range</code> | The range object for the checkbox column. |

<a name="FlatteningResult"></a>

## FlatteningResult : <code>object</code>
Result of building the flattened data array.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| dataToWrite | <code>Array.&lt;Array.&lt;\*&gt;&gt;</code> | 2D array of data to write back to the sheet. |
| formulasFlattened | <code>number</code> | Number of formulas that were flattened to FALSE. |

