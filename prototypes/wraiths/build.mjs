// Builds the wraiths' gallery into one file: dist/wraiths.html (open it) and dist/wraiths.artifact.html (publish it).
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const DEBUG = process.argv.includes('--debug'); // node build.mjs --debug: dist/wraiths-debug.html, not minified (for the masters' audit)
const res = await build({ entryPoints: [path.join(here, 'main.js')], bundle: true, format: 'iife', target: 'es2020', write: false, minify: !DEBUG, legalComments: 'none',
  loader: { '.bin': 'binary', '.webp': 'dataurl' }, nodePaths: [path.join(here, 'node_modules')] });
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const body = (await readFile(path.join(here, 'shell.html'), 'utf8')).replace('/*SCRIPT*/', () => js);
await mkdir(path.join(here, 'dist'), { recursive: true });
const full = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n' + body + '</body>\n</html>\n';
if (DEBUG) { await writeFile(path.join(here, 'dist/wraiths-debug.html'), full); console.log('built dist/wraiths-debug.html'); process.exit(0); }
await writeFile(path.join(here, 'dist/wraiths.html'), full);
await writeFile(path.join(here, 'dist/wraiths.artifact.html'), body);
console.log(`built dist/wraiths.html (${(Buffer.byteLength(full) / 1024).toFixed(0)} KB)`);
