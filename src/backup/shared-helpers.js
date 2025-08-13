"use strict";

/**
 * @OnlyCurrentDoc
 *
 * Shared utility functions for backup and restore operations.
 * These helpers are used by both import and export functionality.
 */

const LETTERS_IN_ALPHABET = 26;
const ASCII_CHAR_CODE_FOR_A = 65;

/* exported columnToLetter */
/**
 * Helper function to convert a 1-based column number to its A1 letter representation.
 * E.g., 1 -> A, 2 -> B, 27 -> AA
 * @param {number} column The column number (1-indexed).
 * @returns {string} The A1 letter representation.
 */
function columnToLetter(column) {
  let letter = "";
  while (column > 0) {
    const temp = (column - 1) % LETTERS_IN_ALPHABET;
    letter = String.fromCharCode(temp + ASCII_CHAR_CODE_FOR_A) + letter;
    column = (column - temp - 1) / LETTERS_IN_ALPHABET;
  }
  return letter;
}

/* exported parseA1 */
/**
 * Helper function to convert an A1 notation string (e.g., "A1", "C5", "AA10")
 * into a 0-based row and column index object { row: number, col: number }.
 * @param {string} a1Notation The cell's A1 notation.
 * @returns {{row: number, col: number}} An object with 0-indexed row and column.
 */
function parseA1(a1Notation) {
  const match = a1Notation.match(/^(?<letters>[A-Z]+)(?<num>\d+)$/v);
  if (!match) {
    throw new Error(`Invalid A1 notation: ${a1Notation}`);
  }
  const colLetters = match.groups.letters;
  const rowNum = parseInt(match.groups.num, 10);

  let col = 0;
  // Convert column letters to number
  for (let idx = 0; idx < colLetters.length; idx++) {
    col =
      col * LETTERS_IN_ALPHABET +
      (colLetters.charCodeAt(idx) - "A".charCodeAt(0) + 1);
  }

  // Convert to 0-based
  return { row: rowNum - 1, col: col - 1 };
}

/* exported isSupportedDateString */
/**
 * Helper function to check if a string is in a supported date format (ISO 8601 or MM/DD/YYYY).
 * @param {string} str The string to check.
 * @returns {boolean} True if the string matches a supported date format, false otherwise.
 */
function isSupportedDateString(str) {
  if (typeof str !== "string") return false;
  // Regex to check for ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/v;
  // Regex to check for MM/DD/YYYY format.
  const usFormatRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/v;
  return isoRegex.test(str) || usFormatRegex.test(str);
}

/* exported tryParseDate */
/**
 * Helper function to attempt parsing a value into a Date object if it's a supported date string.
 * Otherwise, returns the original value.
 * @param {*} value The value to potentially parse.
 * @returns {*} A Date object if parsed, otherwise the original value.
 */
function tryParseDate(value) {
  if (isSupportedDateString(value)) {
    const date = new Date(value);
    // Check if the parsed date is valid (not "Invalid Date")
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return value;
}
