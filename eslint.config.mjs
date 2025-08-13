import js from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import prettierConfig from "eslint-config-prettier";
import gasPlugin from "eslint-plugin-googleappsscript";
import jsdoc from "eslint-plugin-jsdoc";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig([
  {
    files: ["src/**/*.js"],
    plugins: {
      js,
      googleappsscript: gasPlugin,
      jsdoc: jsdoc,
    },
    // Start with all of ESLint's core rules enabled
    extends: [js.configs.all, jsdoc.configs["flat/recommended"]],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script", // GAS files are not ES modules
      globals: {
        // Add browser globals and Google Apps Script globals
        // Make browser globals readonly
        ...Object.fromEntries(
          Object.keys(globals.browser).map((key) => [key, "readonly"])
        ),

        // Make Google Apps Script globals readonly
        ...Object.fromEntries(
          Object.keys(gasPlugin.environments.googleappsscript.globals).map(
            (key) => [key, "readonly"]
          )
        ),
      },
    },
    rules: {
      // --- Custom Rule Overrides ---
      "capitalized-comments": ["error", "always", { ignoreConsecutiveComments: true }],
      "func-style": ["error", "declaration"], // Use function declarations, not expressions
      "guard-for-in": "off", // No guard needed because there is no inheritance used
      "jsdoc/check-tag-names": ["error", { definedTags: ["OnlyCurrentDoc"] }],
      "max-statements": ["error", 17], // Increase from 10 to 17
      "max-lines": ["error", 350],     // Increase from 300 to 350
      "no-console": "off", // console.log is used for Apps Script logging
      "no-inline-comments": ["error", { "ignorePattern": "Column \\w+" }], // Map to column number
      "no-implicit-globals": "off", // Apps Script functions can only be in global scope
      "no-magic-numbers": ["error", { ignore: [-1, 0, 1] }], // -1, 0, and 1 are used often
      "no-param-reassign": "off", // Only for non-strict mode, and strict mode is used
      "no-plusplus": "off", // ++ is preferred over += 1
      "no-underscore-dangle": "off", // Apps Script private function names end with _
      "one-var": ["error", "never"], // Don't combine variable declarations with ,
      "prefer-destructuring": "off", // Prefer not destructuring with single assignment
      "sort-keys": "off", // Enforcing alphabetical order of keys is not always practical
      strict: ["error", "global"], // Use global strict, not function


      // --- Notable Default Rules ---
      complexity: "error",
      "max-lines-per-function": "error",
      "max-params": ["error", 3],
      "no-continue": "error",
      "no-lonely-if": "error", // Possible during refactoring
      "no-unused-vars": "error",
      "no-use-before-define": "error",

      "jsdoc/check-types": "warn", // object vs Object
    },
  },
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/commonmark",
    extends: ["markdown/recommended"],
  },
  // This must be the last configuration in the array to override other configs
  prettierConfig,
]);
