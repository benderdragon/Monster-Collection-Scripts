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
 * in the project's 'src' directory, organized within a 'docs/api' folder.
 * This function implements a caching mechanism: documentation for a source file
 * is only regenerated if the source file has been modified more recently
 * than its corresponding generated Markdown file, or if the Markdown file
 * does not exist. It also cleans up obsolete documentation files.
 *
 * @async
 * @returns {Promise<void>} A promise that resolves when all documentation has been generated.
 */
async function generateApiDocs() {
  try {
    const rootDir = path.join(__dirname, '..');
    const sourceDir = path.join(rootDir, 'src'); // Point to the 'src' directory
    const sourceFiles = await getAllJsFilesInDirectory(sourceDir);

    const outputDir = path.join(rootDir, 'docs', 'api');
    await fs.mkdir(outputDir, { recursive: true }); // Ensure the output directory exists

    let existingGeneratedFiles = new Set();
    try {
      const filesInOutputDir = await fs.readdir(outputDir);
      const filteredFiles = filesInOutputDir.filter(f => f.endsWith('.md') && f !== 'README.md');
      existingGeneratedFiles = new Set(filteredFiles);
    } catch (err) {
      // Directory might be empty or not exist yet, suppress error
      console.warn(`Warning: Could not read existing files in ${outputDir}. This might be normal for a first run.`);
    }

    const currentGeneratedFileNames = new Set(); // Names of .md files that *should* exist
    let documentationUpdated = false; // Flag to track if any file was regenerated or removed

    for (const file of sourceFiles) {
      const baseName = path.basename(file, '.js');
      const outputFileName = `${baseName}.md`;
      const outputFilePath = path.join(outputDir, outputFileName);
      currentGeneratedFileNames.add(outputFileName); // Add to the set of files that should exist

      let shouldRegenerate = true;
      try {
        const sourceStats = await fs.stat(file);
        const outputStats = await fs.stat(outputFilePath);

        // If output file exists and is newer than or same age as source file, skip regeneration
        // Use mtimeMs for millisecond precision
        if (outputStats.isFile() && outputStats.mtimeMs >= sourceStats.mtimeMs) {
          shouldRegenerate = false;
        }
      } catch (e) {
        // outputFilePath does not exist, so it needs to be generated
      }

      if (shouldRegenerate) {
        const output = await jsdoc2md.render({ files: file });
        await fs.writeFile(outputFilePath, output);
        console.log(`Generated documentation for ${file} at ${outputFilePath}`);
        documentationUpdated = true;
      }
    }

    // Cleanup: Remove generated files that no longer have a corresponding source file
    for (const existingFile of existingGeneratedFiles) {
      if (!currentGeneratedFileNames.has(existingFile)) {
        const filePathToRemove = path.join(outputDir, existingFile);
        await fs.unlink(filePathToRemove);
        console.log(`Removed obsolete documentation file: ${filePathToRemove}`);
        documentationUpdated = true;
      }
    }

    // Only regenerate the index if a file was added, removed, or updated.
    if (documentationUpdated) {
        const indexContent = [
        '# API Reference',
        '',
        'This section contains the auto-generated API documentation for the project.',
        'It is regenerated automatically by a pre-commit hook.',
        '',
        ...[...currentGeneratedFileNames].sort().map(file => `- [${path.basename(file, '.md')}](${file})`)
        ].join('\n');
        
        const indexFilePath = path.join(outputDir, 'README.md');
        await fs.writeFile(indexFilePath, indexContent);
        console.log(`API index file was updated.`);
    } else {
        console.log('No documentation changes needed. Skipping index file update.');
    }

  } catch (error) {
    console.error('Error generating API documentation:', error);
  }
}

generateApiDocs();