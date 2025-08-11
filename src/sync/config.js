"use strict";

/**
 * @OnlyCurrentDoc
 * @file Shared configuration for monster collection sync scripts.
 * This configuration is used by both the checkbox synchronization system
 * and the formula flattening utility.
 */

/* exported CONFIG */
/**
 * Configuration object for monster collection synchronization.
 * IMPORTANT: Add the names of all sheets you want to synchronize into this list.
 * The script assumes for ALL these sheets:
 * - Column A contains the checkboxes.
 * - Column B contains the monster names.
 * @constant {object}
 * @property {Array<string>} syncSheetNames Names of sheets to synchronize checkboxes across.
 */
const CONFIG = {
  syncSheetNames: [
    "Collection",
    "v257 PQ Mobs",
    "v257 2-Stars",
    "v257 2-Star Mobs",
    "Remaining",
    "Elites",
    "Field",
    "Quest",
    "Boss",
    "Dungeon",
    "Special",
    "Ref",
    // Eventually add "Next Mob" sheets
  ],
};