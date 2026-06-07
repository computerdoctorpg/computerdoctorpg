import * as esbuild from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

await esbuild.build({
  entryPoints: [join(root, 'server/pdfEntry.jsx')],
  outfile: join(root, 'server/pdfBundle.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  alias: {
    '@': join(root, 'src'),
  },
  external: ['@react-pdf/renderer', 'react', 'react/jsx-runtime'],
});

console.log('Built server/pdfBundle.mjs');
