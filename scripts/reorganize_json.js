const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'eventos.json');
let rawData = fs.readFileSync(filePath, 'utf8');
let data = JSON.parse(rawData);

const reordered = data.map(evento => {
    // Criar novo objeto com ordem específica
    const newEvento = {};
    
    // Ordem desejada
    newEvento.nome = evento.nome;
    newEvento.horario_visitacao = evento.horario_visitacao || 'A definir';
    
    // Adicionar resto dos campos em ordem (exceto nome e horario_visitacao)
    ['tipo', 'bairro', 'endereco', 'latitude', 'longitude', 'imagens', 'horarios', 'descricao', 'site', 'instagram', 'distancia_airbnb_m'].forEach(key => {
        if (evento.hasOwnProperty(key)) {
            newEvento[key] = evento[key];
        }
    });
    
    // Adicionar qualquer campo que não esteja na lista acima
    Object.keys(evento).forEach(key => {
        if (!newEvento.hasOwnProperty(key)) {
            newEvento[key] = evento[key];
        }
    });
    
    return newEvento;
});

const output = JSON.stringify(reordered, null, 4);
fs.writeFileSync(filePath, output);
console.log('✓ Todos os ' + reordered.length + ' eventos reorganizados com horario_visitacao após nome!');
