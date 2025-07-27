1.  **Configuration:** The `CONFIG` section at the top now separates your sheets into two types:
    *   `standardSheets`: A list of sheets with a normal, one-name-per-row layout.
    *   `multiLineNameSheet`: The specific name of the sheet with the special two-line format (i.e., "Elites").

2.  **Detecting the Edit Location:** When you edit a checkbox, the `onEdit` function first determines which type of sheet you are on.

3.  **Getting the Monster Name:**
    *   If you edit a **standard sheet**, it grabs the name directly from the cell in Column B.
    *   If you edit the **"Elites" sheet**, it reads the name from Column B of the current row *and* the row below it, then joins them with a space to create the full monster name (e.g., "Elite Boss" + " " + "Black Knight").

4.  **Synchronizing the Data:** The `syncAllCheckboxes` function then performs two distinct searches:
    *   **On Standard Sheets:** It uses the highly efficient `createTextFinder` to search for the full monster name in a single pass.
    *   **On the "Elites" Sheet:** It performs a custom search. It loops through the name column, manually combining every pair of adjacent rows to see if they form a name that matches the one being synced. When it finds the correct pair, it updates the checkbox on the first of the two rows.