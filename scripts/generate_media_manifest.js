const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MEDIA_DIR = path.join(ROOT, 'assets', 'midia_eventos');
const OUTPUT_DIR = path.join(ROOT, 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'midia_manifest.json');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']);

function isImage(file) {
  return IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function generateManifest() {
  if (!fs.existsSync(MEDIA_DIR)) {
    console.error(`Media directory not found: ${MEDIA_DIR}`);
    process.exit(1);
  }

  const placeholder = ['assets', 'midia_eventos', 'placeholder.svg'].join('/');
  const entries = fs.readdirSync(MEDIA_DIR, { withFileTypes: true });

  const manifest = {};

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const folderName = entry.name;
      const folderPath = path.join(MEDIA_DIR, folderName);
      const files = fs.readdirSync(folderPath, { withFileTypes: true })
        .filter(d => d.isFile() && isImage(d.name))
        .map(d => path.join('assets', 'midia_eventos', folderName, d.name).replace(/\\/g, '/'));

      if (files.length === 0) {
        manifest[folderName] = [placeholder];
      } else {
        manifest[folderName] = files;
      }
    }
  }

  // Also include root-level placeholder only
  manifest['__placeholder__'] = [placeholder];

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Manifest generated: ${OUTPUT_FILE}`);
}

generateManifest();
