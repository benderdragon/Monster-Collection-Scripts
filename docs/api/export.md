## Functions

<dl>
<dt><a href="#extractCellData_">extractCellData_(range)</a> ⇒ <code>object</code></dt>
<dd><p>Extract values and formulas from a range.</p>
</dd>
<dt><a href="#processSheet_">processSheet_(sheet)</a> ⇒ <code>object</code> | <code>null</code></dt>
<dd><p>Process a single sheet and return its cell data.</p>
</dd>
<dt><a href="#generateTimestampedFileName_">generateTimestampedFileName_(spreadsheetName)</a> ⇒ <code>string</code></dt>
<dd><p>Generate a timestamped filename for the export.</p>
</dd>
<dt><a href="#saveToGoogleDrive_">saveToGoogleDrive_(data, fileName)</a></dt>
<dd><p>Save data to Google Drive as a JSON file.</p>
</dd>
<dt><a href="#exportToJsonFile">exportToJsonFile([customFileName])</a></dt>
<dd><p>Exports all cell content (values and formulas) from the active Google Spreadsheet
to a JSON file in Google Drive with a customizable filename. This script is
optimized to minimize API calls.</p>
</dd>
</dl>

<a name="extractCellData_"></a>

## extractCellData\_(range) ⇒ <code>object</code>
Extract values and formulas from a range.

**Kind**: global function  
**Returns**: <code>object</code> - Object mapping A1 notation to cell content.  

| Param | Type | Description |
| --- | --- | --- |
| range | <code>GoogleAppsScript.Spreadsheet.Range</code> | The range to extract data from. |

<a name="processSheet_"></a>

## processSheet\_(sheet) ⇒ <code>object</code> \| <code>null</code>
Process a single sheet and return its cell data.

**Kind**: global function  
**Returns**: <code>object</code> \| <code>null</code> - The sheet's cell data or null if empty.  

| Param | Type | Description |
| --- | --- | --- |
| sheet | <code>GoogleAppsScript.Spreadsheet.Sheet</code> | The sheet to process. |

<a name="generateTimestampedFileName_"></a>

## generateTimestampedFileName\_(spreadsheetName) ⇒ <code>string</code>
Generate a timestamped filename for the export.

**Kind**: global function  
**Returns**: <code>string</code> - The generated filename.  

| Param | Type | Description |
| --- | --- | --- |
| spreadsheetName | <code>string</code> | The name of the spreadsheet. |

<a name="saveToGoogleDrive_"></a>

## saveToGoogleDrive\_(data, fileName)
Save data to Google Drive as a JSON file.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | The data to save. |
| fileName | <code>string</code> | The filename to use. |

<a name="exportToJsonFile"></a>

## exportToJsonFile([customFileName])
Exports all cell content (values and formulas) from the active Google Spreadsheet
to a JSON file in Google Drive with a customizable filename. This script is
optimized to minimize API calls.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| [customFileName] | <code>string</code> | Optional custom filename. If not provided, a timestamped filename will be generated. |

