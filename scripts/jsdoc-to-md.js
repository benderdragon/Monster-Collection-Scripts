const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs').promises;
const path = require('path');

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
