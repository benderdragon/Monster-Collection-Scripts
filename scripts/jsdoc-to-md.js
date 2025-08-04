/**
 * @file Generates Markdown documentation from JSDoc comments in JavaScript files.
 * @author The AI Assistant
 */

const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs').promises;
const path = require('path');

/**
 * Scans a directory for all .js files.
 * @async
 * @param {string} directoryPath - The path to the directory to search.
 * @returns {Promise<string[]>} A promise that resolves to an array of file paths for all .js files found.
 */
async function getAllJsFilesInDirectory(directoryPath) {
    const jsFiles = [];

    // Read the contents of the directory asynchronously
    const files = await fs.readdir(directoryPath); 

    // Iterate through files using a for...of loop for proper async/await handling
    for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const stats = await fs.stat(filePath); // Await fs.stat for file information

        if (stats.isFile() && path.extname(file) === '.js') {
            jsFiles.push(filePath);
        }
    }

    return jsFiles;
}

/**
 * Generates Markdown documentation for each JavaScript file in the project's root directory.
 * It uses `jsdoc-to-markdown` to parse JSDoc comments and saves the output to a 'docs' directory.
 * This function locates all .js files in the parent directory, processes each one,
 * and writes the generated documentation to a corresponding .md file in the 'docs' folder.
 * @async
 * @returns {Promise<void>} A promise that resolves when all documentation has been generated.
 */
async function generateFileDocs() {
  const files = await getAllJsFilesInDirectory(path.join(__dirname, '..'));

  const outputDir = 'docs'; // Directory to save the generated Markdown files
  await fs.mkdir(outputDir, { recursive: true }); // Ensure the output directory exists

  for (const file of files) {
    try {
      const output = await jsdoc2md.render({ files: file });

      // Create a filename for the Markdown output based on the original file name
      const baseName = path.basename(file, '.js');
      const outputFilePath = path.join(outputDir, `${baseName}.md`);

      await fs.writeFile(outputFilePath, output);
      console.log(`Generated documentation for ${file} at ${outputFilePath}`);
    } catch (error) {
      console.error(`Error generating documentation for ${file}:`, error);
    }
  }
}

generateFileDocs();