# Monster Collection Checkbox Sync Script

This Google Apps Script provides robust, two-way synchronization for checkboxes across multiple sheets in "The Ultimate Guide to Monster Collection" spreadsheet. It is designed to be highly efficient, safe for sheets containing formulas, and easy to maintain.

## Features

-   **Full Sheet Synchronization**: When a user edits a checkbox, the script treats the entire edited sheet as the "source of truth," ensuring that actions like toggling multiple checkboxes with the spacebar work reliably.
-   **High-Performance Batching**: The script uses efficient batch operations to read and write data, minimizing communication with the spreadsheet to keep it fast and responsive, even on very large sheets.
-   **Formula Safety**: The core synchronization logic is designed to never overwrite cells containing formulas. It intelligently reads existing formulas and skips updating those cells.
-   **Developer Utility**: The script includes a manually-run utility function to "flatten" checkbox columns that may contain formulas after an update from the master spreadsheet template.
-   **Detailed Logging**: The script provides clear, detailed logs for every operation, which can be viewed in the Apps Script "Executions" panel for easy troubleshooting.

## How to Use the Script

There are two primary ways to interact with the script: as a spreadsheet user and as a developer/maintainer.

### For Spreadsheet Users (Day-to-Day Use)

Using the script is seamless and requires no special action.

-   **Just edit checkboxes!** Click any checkbox in Column A on any of the configured monster sheets (`Collection`, `Elites`, `Field`, etc.).
-   The script will automatically run in the background and update the corresponding checkboxes for that same monster on all other configured sheets.
-   This works for single edits, multi-cell edits (like dragging the fill handle or pasting), and toggling a multi-cell selection with the **spacebar**.

### For Spreadsheet Developers/Maintainers

#### Installation & Configuration

1.  Open the spreadsheet.
2.  Navigate to `Extensions > Apps Script`.
3.  Copy the entire script code and paste it into the `Code.gs` file, replacing any existing content.
4.  **Configure Sheets**: At the top of the script, modify the `CONFIG.syncSheetNames` array to include the exact names of all sheets you want to be part of the synchronization.
    ```javascript
    const CONFIG = {
      syncSheetNames: [
        "Collection",
        "Elites",
        "Field",
        // Add other sheet names here
      ]
    };
    ```
5.  Click the **Save project** icon. The script is now live and will trigger on edits.

#### Using the `flattenCheckboxFormulas` Utility

After you update your spreadsheet from a new master version, some of the checkbox columns may revert to containing formulas instead of simple `TRUE`/`FALSE` values. This utility is designed to fix that.

**What it does:** It finds every cell in Column A that is a **checkbox with a formula** on a monster data row and replaces the formula with a static `FALSE` value. It safely preserves all other formulas.

**How to run it:**
1.  Open the script editor (`Extensions > Apps Script`).
2.  In the toolbar at the top of the editor, select the `flattenCheckboxFormulas` function from the dropdown menu.
3.  Click the **Run** button.
4.  The script will execute. You can view its progress in the **Execution log** at the bottom of the screen.

---

## How It Works (Technical Overview)

The script is composed of two main parts: the `onEdit` trigger for live synchronization and the manually-run `flattenCheckboxFormulas` utility.

### Live Synchronization (`onEdit` and `syncAllSheets`)

The core logic follows a "source of truth" model, optimized for performance.

1.  **Trigger**: When a user edits a cell in the checkbox column of a configured sheet, the `onEdit` function is triggered.
2.  **Read the Source of Truth**: Instead of processing just the edited cell, the script reads the **entire state** (values of checkboxes and monster names) of the sheet that was just edited. This is the key to correctly handling multi-cell toggles with the spacebar.
3.  **Create a Data Map**: It processes this data into a `Map` object, where each key is a normalized monster name and the value is its `true`/`false` checkbox state. This creates an efficient lookup table.
4.  **Sync Target Sheets**: The script then iterates through all other configured sheets. For each target sheet:
    *   It performs a batch read to get all values, formulas, and data validations.
    *   It compares each row against the "source of truth" map.
    *   If a row has a monster that needs updating **and** its checkbox cell does not contain a formula, the required update is added to a list.
5.  **Batch Updates**: The list of required updates is passed to the `groupUpdatesIntoBatches` helper function. This function intelligently groups any adjacent row updates into single "batches."
6.  **Apply Changes**: The script loops through the optimized batches and applies all changes for each batch with a single, high-performance `setValues()` call, ensuring maximum speed.

### Formula Flattening (`flattenCheckboxFormulas`)

This developer utility is designed to be both precise and safe.

1.  **Iterate Sheets**: The script loops through all configured sheets except for `Collection`.
2.  **Batch Read**: For each sheet, it reads the `values`, `formulas`, and `dataValidations` for the name and checkbox columns in batch operations.
3.  **Rebuild In Memory**: The script creates a new array in memory to represent the final state of the checkbox column. It iterates through the data row by row and decides what to put in the new array:
    *   If a cell **is a checkbox with a formula on a monster row**, it adds `false`.
    *   If a cell **is a formula but not a target**, it adds the original formula string (e.g., `'=IF(...)'`).
    *   If a cell **is a static value**, it adds the original value (e.g., `true`, a header string, etc.).
4.  **Single Batch Write**: Once the new data array is fully constructed in memory, it's written back to the spreadsheet's checkbox column in a single `setValues()` call, which correctly interprets and applies both formulas and static values. This ensures that only the intended cells are changed.