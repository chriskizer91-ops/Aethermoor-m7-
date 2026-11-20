// Builds the Bestiary into one file: dist/bestiary.html (open it) and dist/bestiary.artifact.html (publish it).
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const res = await build({ entryPoints: [path.join(here, 'main.js')], bundle: true, format: 'iife', target: 'es2020', write: false, minify: true, legalComments: 'none' });
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const body = (await readFile(path.join(here, 'shell.html'), 'utf8')).replace('/*SCRIPT*/', () => js);
await mkdir(path.join(here, 'dist'), { recursive: true });
const full = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n' + body + '</body>\n</html>\n';
await writeFile(path.join(here, 'dist/bestiary.html'), full);
await writeFile(path.join(here, 'dist/bestiary.artifact.html'), body);
console.log(`built dist/bestiary.html (${(Buffer.byteLength(full) / 1024).toFixed(0)} KB)`);
