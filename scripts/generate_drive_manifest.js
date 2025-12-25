// Gera data/midia_manifest.json a partir de uma pasta do Google Drive.
// Requer: Node 18+, variável de ambiente GOOGLE_DRIVE_API_KEY e o ID da pasta raiz compartilhada.
// Uso: GOOGLE_DRIVE_API_KEY=seu_api_key node scripts/generate_drive_manifest.js 1ABCDEF...

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
const ROOT_FOLDER_ID = process.argv[2];
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT, 'data', 'midia_manifest.json');

if (!API_KEY) {
    console.error('Defina GOOGLE_DRIVE_API_KEY. Vá em https://console.cloud.google.com/apis/credentials e gere uma API key para a Drive API v3.');
    process.exit(1);
}

if (!ROOT_FOLDER_ID) {
    console.error('Informe o ID da pasta raiz compartilhada. Ex: node scripts/generate_drive_manifest.js 1I91va3ddJlpksTLccYELjRJq5X9jidAM');
    process.exit(1);
}

const driveRequest = (query) => {
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
};

const encodeQuery = (params) => Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

async function listSubfolders(folderId) {
    const params = {
        q: `'${folderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id,name)',
        pageSize: 1000
    };
    return driveRequest(encodeQuery(params));
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
    console.log(`Listando subpastas em ${ROOT_FOLDER_ID}...`);
    const folders = await listSubfolders(ROOT_FOLDER_ID);
    console.log(`Encontradas ${folders.length} pastas.`);

    const manifest = { __placeholder__: ['https://via.placeholder.com/600x400?text=Sem+imagem'] };

    for (const folder of folders) {
        console.log(`→ Pasta: ${folder.name}`);
        const images = await listImages(folder.id);
        const urls = images.map(f => `https://drive.google.com/uc?export=view&id=${f.id}`);
        manifest[folder.name] = urls.length > 0 ? urls : manifest.__placeholder__;
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`Manifesto salvo em ${OUTPUT_FILE}`);
})();
