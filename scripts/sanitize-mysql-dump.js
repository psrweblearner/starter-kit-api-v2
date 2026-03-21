#!/usr/bin/env node
'use strict';

/**
 * Portable MySQL dump sanitizer for local imports.
 *
 * It removes the common export-time incompatibilities we have seen with this
 * project:
 * - GTID metadata from MySQL 8 dumps
 * - MySQL 8 utf8mb4_0900_ai_ci collation
 * - hard-coded DEFINER clauses on views/routines/triggers/events
 *
 * Usage:
 *   node scripts/sanitize-mysql-dump.js <input.sql> [output.sql] [collation]
 *
 * Example:
 *   node scripts/sanitize-mysql-dump.js "C:\Users\me\Downloads\starter.sql"
 */

const fs = require('fs');
const path = require('path');

function usage() {
  console.error('Usage: node scripts/sanitize-mysql-dump.js <input.sql> [output.sql] [collation]');
  process.exit(1);
}

const [, , inputArg, outputArg, collationArg] = process.argv;

if (!inputArg) {
  usage();
}

const inputPath = path.resolve(inputArg);
const outputPath = outputArg
  ? path.resolve(outputArg)
  : `${inputPath.replace(/\.sql$/i, '')}-clean.sql`;
const targetCollation = collationArg || 'utf8mb4_general_ci';

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

let sql = fs.readFileSync(inputPath, 'utf8');

const gtidPattern = /^\s*(?:--\s*)?SET @@GLOBAL\.GTID_PURGED=.*?;\s*$/gmi;
const definerPattern = /DEFINER\s*=\s*(?:`[^`]+`@`[^`]+`|'[^']+'@'[^']+')\s*/gi;
const collationPattern = /utf8mb4_0900_ai_ci/gi;

const gtidMatches = sql.match(gtidPattern) || [];
const definerMatches = sql.match(definerPattern) || [];
const collationMatches = sql.match(collationPattern) || [];

sql = sql.replace(gtidPattern, '-- GTID_PURGED removed for portable import');
sql = sql.replace(definerPattern, '');
sql = sql.replace(collationPattern, targetCollation);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sql, 'utf8');

console.log(`Sanitized dump written to: ${outputPath}`);
console.log(`Removed GTID lines: ${gtidMatches.length}`);
console.log(`Removed DEFINER clauses: ${definerMatches.length}`);
console.log(`Replaced MySQL 8 collations: ${collationMatches.length}`);
console.log(`Target collation used: ${targetCollation}`);
