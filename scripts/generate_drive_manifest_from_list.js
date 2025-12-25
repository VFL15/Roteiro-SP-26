// Gera data/midia_manifest.json a partir de um JSON mapping evento -> link/ID de pasta do Drive.
// Requer: Node 18+, variável de ambiente GOOGLE_DRIVE_API_KEY.
// Uso: coloque em data/drive_folders.json algo como:
// {
//   "Theatro Municipal": "https://drive.google.com/drive/folders/XXX",
//   "Bar dos Arcos": "1ABCDEF..."
// }
// Depois rode:
//   $env:GOOGLE_DRIVE_API_KEY="SUA_KEY"; node scripts/generate_drive_manifest_from_list.js

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
const ROOT = path.resolve(__dirname, '..');
const INPUT_FILE = path.join(ROOT, 'data', 'drive_folders.json');
const OUTPUT_FILE = path.join(ROOT, 'data', 'midia_manifest.json');

if (!API_KEY) {
    console.error('Defina GOOGLE_DRIVE_API_KEY. Vá em https://console.cloud.google.com/apis/credentials e gere uma API key para a Drive API v3.');
    process.exit(1);
}

if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Crie o arquivo ${INPUT_FILE} com o mapa evento -> link/ID da pasta do Drive.`);
    process.exit(1);
}

function extractId(linkOrId) {
    // aceita ID puro ou URL contendo folders/<id>
    const m = linkOrId.match(/[\w-]{20,}/);
    return m ? m[0] : null;
}

function driveRequest(query) {
    const url = `https://www.googleapis.com/drive/v3/files?${query}&key=${API_KEY}`;
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    return reject(new Error(`Drive API ${res.statusCode}: ${data}`));
                }
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed.files || []);
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

function encodeQuery(params) {
    return Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
}

async function listImages(folderId) {
    const params = {
        q: `'${folderId}' in parents and trashed=false and mimeType contains 'image/'`,
        fields: 'files(id,name)',
        pageSize: 1000
    };
    return driveRequest(encodeQuery(params));
}

(async () => {
    const mapping = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
    const manifest = { __placeholder__: ['https://via.placeholder.com/600x400?text=Sem+imagem'] };

    for (const [evento, link] of Object.entries(mapping)) {
        const id = extractId(link);
        if (!id) {
            console.warn(`Ignorando ${evento}: ID não encontrado no link fornecido.`);
            continue;
        }
        console.log(`→ ${evento} (folder ${id})`);
        try {
            const images = await listImages(id);
            const urls = images.map(f => `https://drive.google.com/uc?export=view&id=${f.id}`);
            manifest[evento] = urls.length > 0 ? urls : manifest.__placeholder__;
        } catch (err) {
            console.warn(`Falha ao listar imagens de ${evento}: ${err.message}`);
            manifest[evento] = manifest.__placeholder__;
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`Manifesto salvo em ${OUTPUT_FILE}`);
})();
