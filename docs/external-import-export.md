## Functions

<dl>
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
</dl>

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
