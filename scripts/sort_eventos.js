// Ordena data/eventos.json alfabeticamente por nome e mantém formatação.
// Uso: node scripts/sort_eventos.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'data', 'eventos.json');

function load() {
    const raw = fs.readFileSync(FILE, 'utf-8');
    return JSON.parse(raw);
}

function save(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 4), 'utf-8');
    console.log('eventos.json ordenado e salvo.');
}

function sortEventos(evts) {
    return [...evts].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}

(function main() {
    const eventos = load();
    const sorted = sortEventos(eventos);
    save(sorted);
})();
