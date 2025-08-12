## Functions

<dl>
<dt><a href="#createGidMap_">createGidMap_(spreadsheet)</a> ⇒ <code><a href="#GidToSheetMap">GidToSheetMap</a></code></dt>
<dd><p>Creates a mapping of GID to sheet name for all sheets in the spreadsheet.</p>
</dd>
<dt><a href="#cacheSheetData_">cacheSheetData_(spreadsheet, sheetName, cache)</a> ⇒ <code>Array.&lt;Array.&lt;string&gt;&gt;</code> | <code>null</code></dt>
<dd><p>Reads and caches monster names from a target sheet.</p>
</dd>
<dt><a href="#normalizeName_">normalizeName_(name)</a> ⇒ <code>string</code></dt>
<dd><p>Normalizes a monster name by trimming and collapsing whitespace.</p>
</dd>
<dt><a href="#findMonsterRow_">findMonsterRow_(monsterName, targetNames)</a> ⇒ <code>number</code></dt>
<dd><p>Finds the row number of a monster in the target sheet data.</p>
</dd>
<dt><a href="#createUpdatedRichText_">createUpdatedRichText_(originalRichText, gid, targetRow)</a> ⇒ <code>GoogleAppsScript.Spreadsheet.RichTextValue</code></dt>
<dd><p>Creates a new RichTextValue with updated hyperlink while preserving formatting.</p>
</dd>
<dt><a href="#processLinkCell_">processLinkCell_(cellRichText, monsterName, context)</a> ⇒ <code>GoogleAppsScript.Spreadsheet.RichTextValue</code> | <code>null</code></dt>
<dd><p>Processes a single link cell and updates it if a matching monster is found.</p>
</dd>
<dt><a href="#prepareLinkProcessing_">prepareLinkProcessing_(spreadsheet)</a> ⇒ <code><a href="#LinkProcessingSetup">LinkProcessingSetup</a></code> | <code>null</code></dt>
<dd><p>Prepares the link processing by validating the Collection sheet and setting up required data structures.</p>
</dd>
<dt><a href="#processAllLinks_">processAllLinks_(linkRange, collectionNames, context)</a> ⇒ <code><a href="#LinkProcessingResults">LinkProcessingResults</a></code></dt>
<dd><p>Processes all link cells to check for updates and modify them if needed.</p>
</dd>
<dt><a href="#writeLinkUpdates_">writeLinkUpdates_(linkRange, updatedValues, updatedCount)</a></dt>
<dd><p>Writes the updated link values back to the sheet if any changes were made.</p>
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
<dt><a href="#GidToSheetMap">GidToSheetMap</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#SheetDataCache">SheetDataCache</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#LinkProcessingContext">LinkProcessingContext</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#LinkProcessingSetup">LinkProcessingSetup</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#LinkProcessingResults">LinkProcessingResults</a> : <code>object</code></dt>
<dd></dd>
</dl>

<a name="createGidMap_"></a>

## createGidMap\_(spreadsheet) ⇒ [<code>GidToSheetMap</code>](#GidToSheetMap)
Creates a mapping of GID to sheet name for all sheets in the spreadsheet.

**Kind**: global function  
**Returns**: [<code>GidToSheetMap</code>](#GidToSheetMap) - Map of GID to sheet name  

| Param | Type | Description |
| --- | --- | --- |
| spreadsheet | <code>GoogleAppsScript.Spreadsheet.Spreadsheet</code> | The active spreadsheet |

<a name="cacheSheetData_"></a>

## cacheSheetData\_(spreadsheet, sheetName, cache) ⇒ <code>Array.&lt;Array.&lt;string&gt;&gt;</code> \| <code>null</code>
Reads and caches monster names from a target sheet.

**Kind**: global function  
**Returns**: <code>Array.&lt;Array.&lt;string&gt;&gt;</code> \| <code>null</code> - Array of monster names or null if sheet not found  

| Param | Type | Description |
| --- | --- | --- |
| spreadsheet | <code>GoogleAppsScript.Spreadsheet.Spreadsheet</code> | The active spreadsheet |
| sheetName | <code>string</code> | Name of the sheet to read from |
| cache | [<code>SheetDataCache</code>](#SheetDataCache) | Cache object to store results |

<a name="normalizeName_"></a>

## normalizeName\_(name) ⇒ <code>string</code>
Normalizes a monster name by trimming and collapsing whitespace.

**Kind**: global function  
**Returns**: <code>string</code> - Normalized name in lowercase  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The name to normalize |

<a name="findMonsterRow_"></a>

## findMonsterRow\_(monsterName, targetNames) ⇒ <code>number</code>
Finds the row number of a monster in the target sheet data.

**Kind**: global function  
**Returns**: <code>number</code> - 1-based row number, or -1 if not found  

| Param | Type | Description |
| --- | --- | --- |
| monsterName | <code>string</code> | Name of the monster to find |
| targetNames | <code>Array.&lt;Array.&lt;string&gt;&gt;</code> | Array of monster names from target sheet |

<a name="createUpdatedRichText_"></a>

## createUpdatedRichText\_(originalRichText, gid, targetRow) ⇒ <code>GoogleAppsScript.Spreadsheet.RichTextValue</code>
Creates a new RichTextValue with updated hyperlink while preserving formatting.

**Kind**: global function  
**Returns**: <code>GoogleAppsScript.Spreadsheet.RichTextValue</code> - Updated rich text value  

| Param | Type | Description |
| --- | --- | --- |
| originalRichText | <code>GoogleAppsScript.Spreadsheet.RichTextValue</code> | Original rich text |
| gid | <code>string</code> | Sheet GID for the new URL |
| targetRow | <code>number</code> | Target row number for the new URL |

<a name="processLinkCell_"></a>

## processLinkCell\_(cellRichText, monsterName, context) ⇒ <code>GoogleAppsScript.Spreadsheet.RichTextValue</code> \| <code>null</code>
Processes a single link cell and updates it if a matching monster is found.

**Kind**: global function  
**Returns**: <code>GoogleAppsScript.Spreadsheet.RichTextValue</code> \| <code>null</code> - Updated rich text or null if no update needed  

| Param | Type | Description |
| --- | --- | --- |
| cellRichText | <code>GoogleAppsScript.Spreadsheet.RichTextValue</code> | Rich text from the cell |
| monsterName | <code>string</code> | Name of the monster to find |
| context | [<code>LinkProcessingContext</code>](#LinkProcessingContext) | Processing context containing spreadsheet, maps, and cache |

<a name="prepareLinkProcessing_"></a>

## prepareLinkProcessing\_(spreadsheet) ⇒ [<code>LinkProcessingSetup</code>](#LinkProcessingSetup) \| <code>null</code>
Prepares the link processing by validating the Collection sheet and setting up required data structures.

**Kind**: global function  
**Returns**: [<code>LinkProcessingSetup</code>](#LinkProcessingSetup) \| <code>null</code> - Processing setup object or null if setup failed  

| Param | Type | Description |
| --- | --- | --- |
| spreadsheet | <code>GoogleAppsScript.Spreadsheet.Spreadsheet</code> | The active spreadsheet |

<a name="processAllLinks_"></a>

## processAllLinks\_(linkRange, collectionNames, context) ⇒ [<code>LinkProcessingResults</code>](#LinkProcessingResults)
Processes all link cells to check for updates and modify them if needed.

**Kind**: global function  
**Returns**: [<code>LinkProcessingResults</code>](#LinkProcessingResults) - Processing results containing updated values and count  

| Param | Type | Description |
| --- | --- | --- |
| linkRange | <code>GoogleAppsScript.Spreadsheet.Range</code> | The range containing link cells |
| collectionNames | <code>Array.&lt;Array.&lt;string&gt;&gt;</code> | The monster names from Collection sheet |
| context | [<code>LinkProcessingContext</code>](#LinkProcessingContext) | The processing context |

<a name="writeLinkUpdates_"></a>

## writeLinkUpdates\_(linkRange, updatedValues, updatedCount)
Writes the updated link values back to the sheet if any changes were made.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| linkRange | <code>GoogleAppsScript.Spreadsheet.Range</code> | The range to write updated values to |
| updatedValues | <code>Array.&lt;Array.&lt;GoogleAppsScript.Spreadsheet.RichTextValue&gt;&gt;</code> | The updated rich text values |
| updatedCount | <code>number</code> | The number of links that were updated |

<a name="updateMonsterLinks"></a>

## updateMonsterLinks()
Updates the hyperlinks in column E of the 'Collection' sheet to point to the
specific cell of the monster in its corresponding location sheet.

This function reads monster names from 'Collection!B' and their associated sheet
links from 'Collection!E'. It then finds the matching monster name in the target
sheet and updates the hyperlink to point directly to the monster's cell (e.g., 'Elites'!B25).

The script normalizes names to ensure matches, collapsing all whitespace (including
newlines) into a single space for comparison. This handles variations like "Prefix Name"
vs. "Prefix\nName". All original rich text formatting in the cell is preserved.

Progress is logged to the Apps Script execution log.

**Kind**: global function  
<a name="GidToSheetMap"></a>

## GidToSheetMap : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [gid] | <code>string</code> | Sheet name corresponding to the GID key. |

<a name="SheetDataCache"></a>

## SheetDataCache : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [sheetName] | <code>Array.&lt;Array.&lt;string&gt;&gt;</code> \| <code>null</code> | Cached monster names from the sheet, or null if sheet not found. |

<a name="LinkProcessingContext"></a>

## LinkProcessingContext : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| spreadsheet | <code>GoogleAppsScript.Spreadsheet.Spreadsheet</code> | The active spreadsheet instance. |
| gidMap | [<code>GidToSheetMap</code>](#GidToSheetMap) | Mapping of sheet GIDs to sheet names. |
| sheetDataCache | [<code>SheetDataCache</code>](#SheetDataCache) | Cache for storing sheet data to avoid re-reading. |

<a name="LinkProcessingSetup"></a>

## LinkProcessingSetup : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| collectionSheet | <code>GoogleAppsScript.Spreadsheet.Sheet</code> | The Collection sheet. |
| context | [<code>LinkProcessingContext</code>](#LinkProcessingContext) | The processing context. |
| lastRow | <code>number</code> | The last row with data in the Collection sheet. |

<a name="LinkProcessingResults"></a>

## LinkProcessingResults : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| updatedValues | <code>Array.&lt;Array.&lt;GoogleAppsScript.Spreadsheet.RichTextValue&gt;&gt;</code> | The updated rich text values. |
| updatedCount | <code>number</code> | The number of links that were updated. |

