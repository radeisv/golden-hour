// Golden Hour — the entrypoint for gta6-cover-art-01 (Node 22, stdlib only).
// The app is plain static files in app/ (index.html plus ES modules, no build
// step, no network at runtime). This program hands it in: it copies app/ and
// screenshots/ into the output directory and writes dossier.json there with
// the vendored make.fun library, so the scorer can check the entry byte for
// byte. Run it locally with MAKEFUN_OUTPUT_DIR set, e.g.
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app itself with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps, as the kit's gate states them: the dossier text is
// capped, screenshots are at most 4 and 256 KiB each, app/ is at most 993
// entries and 48 MiB, and every path inside app/ is at most 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
