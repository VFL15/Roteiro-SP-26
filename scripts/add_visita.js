const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'eventos.json');
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const updated = data.map(evento => ({
    ...evento,
    horario_visitacao: evento.horario_visitacao || 'A definir'
}));

fs.writeFileSync(filePath, JSON.stringify(updated, null, 4));
console.log(`Updated ${updated.length} eventos with horario_visitacao.`);
