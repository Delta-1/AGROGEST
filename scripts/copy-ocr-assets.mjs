import {copyFile, mkdir, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

// These pinned npm assets stay on the same origin as the portal.
// No document content is sent to an OCR service.
const root = fileURLToPath(new URL('../', import.meta.url));
const target = resolve(root, process.argv[2] || 'dist', 'assets/ocr');
await mkdir(target, {recursive: true});
await copyFile(resolve(root, 'node_modules/tesseract.js/dist/worker.min.js'), resolve(target, 'worker.min.js'));
const core = resolve(root, 'node_modules/tesseract.js-core');
for (const name of await readdir(core)) {
  if (/^tesseract-core.*\.wasm(?:\.js)?$/.test(name)) await copyFile(resolve(core, name), resolve(target, name));
}
await copyFile(resolve(root, 'node_modules/@tesseract.js-data/por/4.0.0_best_int/por.traineddata.gz'), resolve(target, 'por.traineddata.gz'));
await copyFile(resolve(root, 'node_modules/tesseract.js/LICENSE.md'), resolve(target, 'LICENSE-tesseract.txt'));
await copyFile(resolve(core, 'LICENSE'), resolve(target, 'LICENSE-core.txt'));
console.log('OCR em português: worker, WASM e modelo copiados.');
