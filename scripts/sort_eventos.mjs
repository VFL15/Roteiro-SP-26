import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('data/eventos.json');
const raw = fs.readFileSync(filePath, 'utf-8');
let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error('Failed to parse JSON:', err.message);
  process.exit(1);
}

if (!Array.isArray(data)) {
  console.error('Expected an array at data/eventos.json');
  process.exit(1);
}

// Sort by nome using pt-BR collation, accent-insensitive
const collator = new Intl.Collator('pt-BR', { sensitivity: 'accent' });
data.sort((a, b) => {
  const an = (a?.nome || '').toString();
  const bn = (b?.nome || '').toString();
  return collator.compare(an, bn);
});

// Write back prettified JSON with trailing newline
const output = JSON.stringify(data, null, 4) + '\n';
fs.writeFileSync(filePath, output, 'utf-8');
console.log('Sorted', data.length, 'events by nome to', filePath);
