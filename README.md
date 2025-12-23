# SP26 - Gerenciador de Eventos

## Configuração do Firebase

Para sincronizar a ordem dos eventos entre todos os usuários, você precisa configurar o Firebase:

### Passo 1: Criar projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Dê um nome (ex: "sp26-eventos")
4. Desabilite Google Analytics (opcional)
5. Clique em "Criar projeto"

### Passo 2: Configurar Realtime Database

1. No menu lateral, clique em "Realtime Database"
2. Clique em "Criar banco de dados"
3. Escolha a localização (ex: United States)
4. Inicie em **modo de teste** (permite leitura/escrita sem autenticação)
5. Clique em "Ativar"

### Passo 3: Obter configurações

1. Clique no ícone de engrenagem > "Configurações do projeto"
2. Role até "Seus aplicativos" e clique no ícone `</>`
3. Registre o app (nome: "SP26")
4. Copie o objeto `firebaseConfig`

### Passo 4: Atualizar o código

Abra `index.html` e substitua o `firebaseConfig` pelo seu:

```javascript
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "seu-projeto.firebaseapp.com",
    databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

### Passo 5: Publicar no GitHub Pages

1. Crie um repositório no GitHub
2. Faça upload de todos os arquivos
3. Vá em Settings > Pages
4. Em "Source", selecione a branch `main` e pasta `root`
5. Clique em "Save"
6. Seu site estará disponível em `https://seu-usuario.github.io/nome-repositorio/`

## Recursos

- ✅ Sincronização em tempo real entre todos os usuários
- ✅ Arrasta e solta para reordenar
- ✅ Botões de seta para mover itens
- ✅ Popup com informações detalhadas (horários por dia da semana)
- ✅ Funciona offline depois do primeiro carregamento
- ✅ Totalmente gratuito (Firebase free tier: 1GB armazenamento, 10GB/mês download)

## Estrutura

```
sp26/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── estado.js
└── data/
    └── eventos.json
```
