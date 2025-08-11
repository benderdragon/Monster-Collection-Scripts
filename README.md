# Monster Collection Scripts for Google Sheets

This repository contains a suite of Google Apps Scripts designed to enhance and automate the "The Ultimate Guide to Monster Collection" Google Sheet. These scripts provide robust features like two-way checkbox synchronization, dynamic hyperlink management, data cleanup utilities, and full spreadsheet backup and restore capabilities.

## Key Features

-   **Two-Way Checkbox Synchronization**: When you check or uncheck a monster on one sheet, the script automatically updates the status of that same monster across all other configured sheets. This is highly optimized for performance and works with multi-cell edits (e.g., toggling with the spacebar).
-   **Formula-Safe Operations**: The synchronization logic is designed to never overwrite cells that contain formulas, ensuring the integrity of your sheet's data and structure.
-   **Dynamic Hyperlink Updating**: A utility script can automatically scan a master "Collection" sheet and update hyperlinks to point to the exact cell of a monster on its respective location sheet (e.g., 'Elites'!B25).
-   **JSON Backup & Restore**: Export the entire spreadsheet state, including all values *and* formulas, to a JSON file in your Google Drive. This backup can be used to restore the sheet, correctly handling array formulas and their spilled results.
-   **Developer Utilities**: Includes helper scripts for data cleanup (e.g., `flattenCheckboxFormulas`) and automated API documentation generation.

## Project Structure

A brief overview of the key files and folders in this project:

```sh
src/
├── sync/
│   ├── config.js               # Shared configuration for sync scripts
│   ├── checkbox-sync.js        # Core checkbox synchronization and onEdit trigger
│   └── flatten-formulas.js     # Developer utility for flattening checkbox formulas
├── update-links.js             # Standalone script to update hyperlinks in Collection sheet
├── external-import-export.js   # Functions for JSON backup and restore
└── utils.js                    # Collection of shared helper functions
scripts/
├── generate_context_markdown.py  # Library for generating project context documentation
├── run_context_generator.py     # Script that runs the context generator
└── jsdoc-to-md.js              # Generates API documentation from JSDoc comments
docs/
├── api/                        # Auto-generated API documentation (Markdown files)
├── autocheck-monsters-guide.md # Detailed user and developer guide
└── ai_instructions.md          # System instructions for AI assistant
outputs/
├── project_context.md          # Auto-generated project overview and context
└── (other auto-generated files)
.husky/                         # Git hooks for pre-commit automation
```

### Key Script Files

-   `src/sync/config.js`: Shared configuration object containing sheet names for synchronization
-   `src/sync/checkbox-sync.js`: The core script for checkbox synchronization, containing the `onEdit` trigger and main sync logic
-   `src/sync/flatten-formulas.js`: Developer utility for converting checkbox formulas to boolean values
-   `src/update-links.js`: A standalone script to update hyperlinks in the `Collection` sheet
-   `src/external-import-export.js`: Contains functions to export the sheet's content to a JSON file and import it back
-   `src/utils.js`: A collection of shared helper functions

### Development & Documentation Tools

-   `scripts/generate_context_markdown.py`: Single-file library that generates comprehensive project context documentation
-   `scripts/run_context_generator.py`: Runner script for the context generator
-   `scripts/jsdoc-to-md.js`: Node.js script for generating API documentation from JSDoc comments in the code
-   `.husky/`: Git hooks configuration for automated pre-commit checks and documentation updates
-   `lint-staged`: Used with Husky for running linters and documentation generators on staged files

## Setup and Usage

### 1. Installation

#### Installation with Clasp (Recommended)
[Clasp](https://github.com/google/clasp) is a command-line tool that lets you manage your Google Apps Script projects locally.

1.  **Install Node.js**: If you don't have it, install [Node.js](https://nodejs.org/).
2.  **Install Clasp**: Open your terminal and install Clasp globally:
    ```sh
    npm install -g @google/clasp
    ```
3.  **Log in to Google**: Authorize Clasp to access your Google account:
    ```sh
    clasp login
    ```
4.  **Create an Apps Script Project**: Open the Google Sheet you want to use these scripts with, and go to **Extensions > Apps Script**. This creates a new, bound script project.
5.  **Get the Script ID**: In the Apps Script editor, go to **Project Settings** (the gear icon ⚙️) and copy the **Script ID**.
6.  **Update Configuration**: In this project's root directory, open the `.clasp.json` file and replace the value of `"scriptId"` with the ID you just copied.
7.  **Push Files**: In your terminal, from the project's root directory, run the following command to push all the local script files to your Apps Script project:
    ```sh
    clasp push
    ```

#### Manual Installation
1.  Open your Google Sheet.
2.  Go to **Extensions > Apps Script**.
3.  For each `.js` file in the `src/` directory of this project, create a corresponding script file in the Apps Script editor:
    -   `src/sync/config.js` → Create "config" file
    -   `src/sync/checkbox-sync.js` → Create "checkbox-sync" file  
    -   `src/sync/flatten-formulas.js` → Create "flatten-formulas" file
    -   `src/update-links.js` → Create "update-links" file
    -   `src/external-import-export.js` → Create "external-import-export" file
    -   `src/utils.js` → Create "utils" file
4.  Copy the contents of each local `.js` file and paste it into the corresponding file in the Apps Script editor.
5.  Save the project in the Apps Script editor.

### 2. Configuration

The checkbox synchronization script needs to know which sheets to monitor.

-   In `src/sync/config.js`, find the `CONFIG` object.
-   Add the names of all sheets you want to synchronize to the `syncSheetNames` array.

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

### 3. Running the Scripts

Most scripts are designed to be run manually from the Apps Script editor, except for the automatic `onEdit` trigger.

-   **Checkbox Sync (`onEdit` in `src/sync/checkbox-sync.js`)**: This runs automatically whenever you edit a checkbox in one of the configured sheets. No manual action is needed.
-   **Update Monster Links (`updateMonsterLinks` in `src/update-links.js`)**:
    1.  In the Apps Script editor, select the `updateMonsterLinks` function from the function dropdown menu.
    2.  Click **Run**.
-   **Export Data (`exportCellContentAndFormulasOptimized` in `src/external-import-export.js`)**:
    1.  Select the `exportCellContentAndFormulasOptimized` function.
    2.  Click **Run**. A JSON file will be saved to the root of your Google Drive.
-   **Import Data (`importCellContentAndFormulasOptimized` in `src/external-import-export.js`)**:
    1.  Select the `importCellContentAndFormulasOptimized` function.
    2.  Click **Run**. You will be prompted to enter the filename of the JSON backup.
-   **Flatten Checkbox Formulas (`flattenCheckboxFormulas` in `src/sync/flatten-formulas.js`)**:
    1.  This is a developer utility used to clean up checkbox columns that contain formulas.
    2.  Select the `flattenCheckboxFormulas` function and click **Run**.

## For Developers

This project uses several automated tools for documentation generation and code quality.

### Prerequisites

-   [Node.js](https://nodejs.org/)
-   [Python 3.x](https://python.org/) (for context generation)

### Development Tools

#### API Documentation Generation
The project uses `jsdoc-to-markdown` to automatically generate API documentation from JSDoc comments in the code.

1.  Install the required Node.js packages:
    ```sh
    npm install
    ```
2.  Run the documentation generator script:
    ```sh
    node scripts/jsdoc-to-md.js
    ```
    This will scan the `.js` files, regenerate the documentation in `docs/api/` if any source files have changed, and update the API index file.

#### Project Context Generation
The project includes a Python-based context generator that creates comprehensive project overviews.

1.  Run the context generator:
    ```sh
    python scripts/run_context_generator.py
    ```
    This generates `outputs/project_context.md` with a complete project overview, file structure, and key functions.

#### Pre-commit Hooks
The project uses Husky and lint-staged for automated pre-commit checks:

-   **ESLint**: Ensures code quality and style consistency
-   **Documentation Updates**: Automatically regenerates documentation when source files change
-   **Context Generation**: Updates project context when relevant files are modified

The pre-commit hooks are configured in `.husky/` and will run automatically when you commit changes.

## API Reference

This section contains the auto-generated API documentation for the project. It is regenerated automatically by the pre-commit hooks.

-   [checkbox-sync](docs/api/checkbox-sync.md)
-   [flatten-formulas](docs/api/flatten-formulas.md)
-   [config](docs/api/config.md)
-   [external-import-export](docs/api/external-import-export.md)
-   [update-links](docs/api/update-links.md)
-   [utils](docs/api/utils.md)

## Development Note

This project was developed in a collaborative, pair-programming style with an AI assistant. The human developer provided high-level requirements, guidance, debugging, and feedback, while the AI assistant wrote the majority of the code. This serves as an example of a modern, AI-augmented development workflow.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.