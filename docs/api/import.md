## Functions

<dl>
<dt><a href="#loadJsonFile_">loadJsonFile_(fileName)</a> ⇒ <code><a href="#FileLoadResult">FileLoadResult</a></code></dt>
<dd><p>Finds and loads JSON file from Google Drive.</p>
</dd>
<dt><a href="#calculateSheetDimensions_">calculateSheetDimensions_(sheetContent)</a> ⇒ <code><a href="#SheetDimensions">SheetDimensions</a></code></dt>
<dd><p>Calculate the dimensions needed for a sheet based on its content.</p>
</dd>
<dt><a href="#resizeTargetSheet_">resizeTargetSheet_(sheet, dimensions)</a> ⇒ <code>GoogleAppsScript.Spreadsheet.Range</code></dt>
<dd><p>Resize the target sheet to accommodate the import data.</p>
</dd>
<dt><a href="#importFormulasPhase_">importFormulasPhase_(config)</a></dt>
<dd><p>Phase 1: Clear target sheet and import formulas only.</p>
</dd>
<dt><a href="#importStaticValuesPhase_">importStaticValuesPhase_(config)</a></dt>
<dd><p>Phase 2: Read current state and overlay static values.</p>
</dd>
<dt><a href="#processSheetContent_">processSheetContent_(targetSheet, sheetContent, sheetName)</a></dt>
<dd><p>Process the import of content for a single sheet.</p>
</dd>
<dt><a href="#processImportData_">processImportData_(spreadsheet, importedData)</a> ⇒ <code>number</code></dt>
<dd><p>Process all sheets from the imported JSON data.</p>
</dd>
<dt><a href="#importFromJsonFile">importFromJsonFile(fileName)</a></dt>
<dd><p>Imports cell content (values and formulas) into the active Google Spreadsheet
from a specified JSON file located in Google Drive. This script uses a two-phase
approach to correctly import formulas and their spilled results.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#SheetDimensions">SheetDimensions</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#ImportSheetConfig">ImportSheetConfig</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#FileLoadResult">FileLoadResult</a> : <code>object</code></dt>
<dd></dd>
</dl>

<a name="loadJsonFile_"></a>

## loadJsonFile\_(fileName) ⇒ [<code>FileLoadResult</code>](#FileLoadResult)
Finds and loads JSON file from Google Drive.

**Kind**: global function  
**Returns**: [<code>FileLoadResult</code>](#FileLoadResult) - Result of file loading operation.  

| Param | Type | Description |
| --- | --- | --- |
| fileName | <code>string</code> | The name of the JSON file to load. |

<a name="calculateSheetDimensions_"></a>

## calculateSheetDimensions\_(sheetContent) ⇒ [<code>SheetDimensions</code>](#SheetDimensions)
Calculate the dimensions needed for a sheet based on its content.

**Kind**: global function  
**Returns**: [<code>SheetDimensions</code>](#SheetDimensions) - The calculated dimensions.  

| Param | Type | Description |
| --- | --- | --- |
| sheetContent | <code>object</code> | The JSON content for the sheet. |

<a name="resizeTargetSheet_"></a>

## resizeTargetSheet\_(sheet, dimensions) ⇒ <code>GoogleAppsScript.Spreadsheet.Range</code>
Resize the target sheet to accommodate the import data.

**Kind**: global function  
**Returns**: <code>GoogleAppsScript.Spreadsheet.Range</code> - The target range for import.  

| Param | Type | Description |
| --- | --- | --- |
| sheet | <code>GoogleAppsScript.Spreadsheet.Sheet</code> | The sheet to resize. |
| dimensions | [<code>SheetDimensions</code>](#SheetDimensions) | The required dimensions. |

<a name="importFormulasPhase_"></a>

## importFormulasPhase\_(config)
Phase 1: Clear target sheet and import formulas only.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| config | [<code>ImportSheetConfig</code>](#ImportSheetConfig) | The import configuration. |

<a name="importStaticValuesPhase_"></a>

## importStaticValuesPhase\_(config)
Phase 2: Read current state and overlay static values.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| config | [<code>ImportSheetConfig</code>](#ImportSheetConfig) | The import configuration. |

<a name="processSheetContent_"></a>

## processSheetContent\_(targetSheet, sheetContent, sheetName)
Process the import of content for a single sheet.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| targetSheet | <code>GoogleAppsScript.Spreadsheet.Sheet</code> | The sheet to import into. |
| sheetContent | <code>object</code> | The JSON content for this sheet. |
| sheetName | <code>string</code> | Name of the sheet for logging. |

<a name="processImportData_"></a>

## processImportData\_(spreadsheet, importedData) ⇒ <code>number</code>
Process all sheets from the imported JSON data.

**Kind**: global function  
**Returns**: <code>number</code> - Number of sheets processed.  

| Param | Type | Description |
| --- | --- | --- |
| spreadsheet | <code>GoogleAppsScript.Spreadsheet.Spreadsheet</code> | The target spreadsheet. |
| importedData | <code>object</code> | The parsed JSON data containing all sheets. |

<a name="importFromJsonFile"></a>

## importFromJsonFile(fileName)
Imports cell content (values and formulas) into the active Google Spreadsheet
from a specified JSON file located in Google Drive. This script uses a two-phase
approach to correctly import formulas and their spilled results.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| fileName | <code>string</code> | The name of the JSON file to import from Google Drive. |

<a name="SheetDimensions"></a>

## SheetDimensions : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| maxRow | <code>number</code> | Maximum row number needed |
| maxCol | <code>number</code> | Maximum column number needed |

<a name="ImportSheetConfig"></a>

## ImportSheetConfig : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| targetRange | <code>GoogleAppsScript.Spreadsheet.Range</code> | The range to import into |
| sheetContent | <code>object</code> | The JSON content for this sheet |
| sheetName | <code>string</code> | Name of sheet for logging |

<a name="FileLoadResult"></a>

## FileLoadResult : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | The parsed JSON data |
| success | <code>boolean</code> | Whether the operation succeeded |
| [error] | <code>string</code> | Error message if operation failed |

