# 🗺️ Roteiro SP-26 - Guia de Viagem para São Paulo

Um roteiro interativo e personalizável para explorar São Paulo em grupos ou casais. Organize seus pontos de interesse (passeios, restaurantes, compras) com horários de funcionamento, localizações e dicas de visitação.

**🌐 Acesse o site:** [Roteiro SP-26](https://vfl15.github.io/Roteiro-SP-26/)

## 📌 O que é?

Roteiro SP-26 é uma aplicação web desenvolvida para ajudar viajantes a planejar suas atividades em São Paulo de forma organizada e eficiente. Com foco em grupos e casais, a ferramenta permite:

- **Visualizar eventos**: 46 pontos de interesse curados em São Paulo
- **Editar detalhes**: nome, descrição, tipo (passeio/ingestão/compras), bairro, endereço
- **Gerenciar horários**: horários de funcionamento por dia (Quinta a Domingo) e horário de visitação
- **Organizar prioridades**: reordenar eventos por importância com sincronização em tempo real
- **Filtrar por preferência**: buscar eventos por tipo, bairro ou dia disponível
- **Consultar informações**: sites, Instagram, distância e detalhes completos

## 🚀 Como Usar

1. Acesse [Roteiro SP-26](https://vfl15.github.io/Roteiro-SP-26/)
2. Navegue pela aba **Eventos** para explorar e editar pontos de interesse
3. Use a aba **Classificação** para reordenar e filtrar eventos
4. Suas edições são salvas localmente no navegador

## 🎯 Objetivo Principal

Roteiro SP-26 é uma **ferramenta de logística de viagem** desenvolvida para ajudar grupos a chegarem em **consenso rápido e preciso** sobre itinerários. 

Através de tecnologia e inteligência digital, simplificamos o processo de planejamento considerando as preferências e valores de cada participante do grupo, facilitando decisões coletivas com base em dados organizados.

A ferramenta é pensada para **consenso interno** entre membros do grupo, permitindo que todos visualizem opções, horários e detalhes antes de tomar decisões coletivas.

## 💾 Persistência

- **Edições locais**: Salvas em localStorage do navegador
- **Ordem de eventos**: Sincronizada via Firebase Realtime Database
- **Sincronização**: Em tempo real entre abas/dispositivos (via Firebase)

## 💝 Sobre

Desenvolvido com ❤️ para planejar uma viagem incrível em São Paulo com quem amo! 

Feito com dedicação e muito carinho para explorar o melhor que São Paulo tem a oferecer. 🌃

## ✨ Funcionalidades

### 📋 Página de Eventos
- Navegação em carousel através dos 46 eventos
- Editor inline com suporte a:
  - **Tipo**: Passeio, Ingestão, Compras (com opção de adicionar novos)
  - **Bairro**: Seleção automática de opções existentes
  - **Horários de Funcionamento**: Quinta, Sexta, Sábado, Domingo
  - **Horário de Visitação**: Horário dedicado para visitas
  - **Reserva**: Sim/Não e link de reserva
  - **Redes Sociais**: Website e Instagram

### 📊 Página de Classificação
- Lista ordenável de eventos com reordenação drag-and-drop vertical (setas ↑ ↓)
- Sincronização em tempo real com Firebase Realtime Database
- Filtros por tipo, bairro e dia da semana
- Visualização de detalhes com modal de informações

### 🗺️ Página de Mapas
- Placeholder para integração futura com mapas interativos

## Recursos

- ✅ Sincronização em tempo real entre todos os usuários
- ✅ Arrasta e solta para reordenar
- ✅ Botões de seta para mover itens
- ✅ Popup com informações detalhadas (horários por dia da semana)
- ✅ Funciona offline depois do primeiro carregamento
- ✅ Totalmente gratuito (Firebase free tier: 1GB armazenamento, 10GB/mês download)

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Realtime Database (para sincronização de ordem)
- **Armazenamento**: JSON local + localStorage para edições
- **Hosting**: GitHub Pages

**Mantido por:** [VFL15](https://github.com/VFL15)  
**Repositório:** [github.com/VFL15/Roteiro-SP-26](https://github.com/VFL15/Roteiro-SP-26)