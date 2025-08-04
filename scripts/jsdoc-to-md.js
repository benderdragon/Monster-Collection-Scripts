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
 * Generates modular Markdown API documentation from all JavaScript files
 * in the project's root directory, organized within a 'docs/api' folder.
 *
 * This function performs the following steps:
 * 1. Locates all .js files in the project root.
 * 2. Creates and clears the 'docs/api' directory to ensure a clean build.
 * 3. For each .js file, it generates a corresponding .md file in 'docs/api'.
 * 4. Generates a 'README.md' file within 'docs/api' that serves as an index,
 *    linking to all the generated documentation files.
 * @async
 * @returns {Promise<void>} A promise that resolves when all documentation has been generated.
 */
async function generateApiDocs() {
  try {
    const rootDir = path.join(__dirname, '..');
    const allJsFiles = await getAllJsFilesInDirectory(rootDir);

    // Filter out this script file to prevent it from documenting itself
    const filesToDocument = allJsFiles.filter(
      (file) => path.basename(file) !== 'jsdoc-to-md.js'
    );

    const outputDir = path.join(rootDir, 'docs', 'api');
    // Ensure the output directory exists and is empty
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });

    const generatedFiles = [];

    for (const file of filesToDocument) {
      const output = await jsdoc2md.render({ files: file });
      const baseName = path.basename(file, '.js');
      const outputFileName = `${baseName}.md`;
      const outputFilePath = path.join(outputDir, outputFileName);

      await fs.writeFile(outputFilePath, output);
      console.log(`Generated documentation for ${file} at ${outputFilePath}`);
      generatedFiles.push(outputFileName);
    }
    
    // Generate the index file (README.md)
    const indexContent = [
      '# API Reference',
      '',
      'This section contains the auto-generated API documentation for the project.',
      '',
      ...generatedFiles.map(file => `- [${path.basename(file, '.md')}](${file})`)
    ].join('\n');
    
    const indexFilePath = path.join(outputDir, 'README.md');
    await fs.writeFile(indexFilePath, indexContent);
    console.log(`Generated API index at ${indexFilePath}`);

  } catch (error) {
    console.error('Error generating API documentation:', error);
  }
}

generateApiDocs();