import { ref, set, get, onValue } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js';

document.addEventListener('DOMContentLoaded', () => {
    const list = document.querySelector('.sortable-list');
    let eventos = [];
    let filteredEventos = [];
    let activeFilters = {
        tipo: '',
        local: '',
        dia: ''
    };
    
    // Page navigation
    const pageVisitacao = document.getElementById('page-visitacao');
    const pageClassificacao = document.getElementById('page-classificacao');
    const pageMapas = document.getElementById('page-mapas');
    const navButtons = document.querySelectorAll('.nav-item');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPage = btn.getAttribute('data-page');
            
            // Update active button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide pages
            pageVisitacao.classList.remove('active');
            pageClassificacao.classList.remove('active');
            pageMapas.classList.remove('active');
            
            if (targetPage === 'visitacao') {
                pageVisitacao.classList.add('active');
            } else if (targetPage === 'classificacao') {
                pageClassificacao.classList.add('active');
            } else if (targetPage === 'mapas') {
                pageMapas.classList.add('active');
            }
        });
    });

    // Filter functionality
    const filterBtn = document.getElementById('filterBtn');
    const filterPanel = document.getElementById('filterPanel');
    const filterTipo = document.getElementById('filterTipo');
    const filterLocal = document.getElementById('filterLocal');
    const filterDia = document.getElementById('filterDia');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const clearFiltersBtn = document.getElementById('clearFilters');

    filterBtn.addEventListener('click', () => {
        filterPanel.classList.toggle('active');
    });

    applyFiltersBtn.addEventListener('click', () => {
        activeFilters.tipo = filterTipo.value;
        activeFilters.local = filterLocal.value;
        activeFilters.dia = filterDia.value;
        applyFilters();
        filterPanel.classList.remove('active');
    });

    clearFiltersBtn.addEventListener('click', () => {
        filterTipo.value = '';
        filterLocal.value = '';
        filterDia.value = '';
        activeFilters.tipo = '';
        activeFilters.local = '';
        activeFilters.dia = '';
        applyFilters();
        filterPanel.classList.remove('active');
    });

    function applyFilters() {
        filteredEventos = eventos.filter(evento => {
            let matchTipo = !activeFilters.tipo || evento.tipo === activeFilters.tipo;
            let matchLocal = !activeFilters.local || evento.local === activeFilters.local;
            let matchDia = !activeFilters.dia || (evento.horarios[activeFilters.dia] && evento.horarios[activeFilters.dia] !== 'Fechado');
            return matchTipo && matchLocal && matchDia;
        });
        renderList();
    }

    function populateFilterOptions() {
        // Populate tipo filter
        const tipos = [...new Set(eventos.map(e => e.tipo))].sort();
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            filterTipo.appendChild(option);
        });

        // Populate local filter
        const locais = [...new Set(eventos.map(e => e.local))].sort();
        locais.forEach(local => {
            const option = document.createElement('option');
            option.value = local;
            option.textContent = local;
            filterLocal.appendChild(option);
        });
    }

    // Scrollbar personalizada removida

    fetch('data/eventos.json')
        .then(response => response.json())
        .then(data => {
            eventos = data;
            filteredEventos = eventos;
            populateFilterOptions();
            loadItems();
        });

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.zIndex = '1000';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.backgroundColor = 'white';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '5px';
    modalContent.style.width = '300px';

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal when clicking outside the content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
        }
    });

    let currentIndex = -1;
    let items = [
        "Item 1",
        "Item 2",
        "Item 3",
        "Item 4",
        "Item 5",
        "Item 6",
        "Item 7",
        "Item 8",
        "Item 9",
        "Item 10",
        "Item 11",
        "Item 12",
        "Item 13",
        "Item 14",
        "Item 15",
        "Item 16",
        "Item 17",
        "Item 18",
        "Item 19",
        "Item 20",
        "Item 21",
        "Item 22",
        "Item 23",
        "Item 24",
        "Item 25",
        "Item 26",
        "Item 27",
        "Item 28",
        "Item 29",
        "Item 30",
        "Item 31",
        "Item 32",
        "Item 33",
        "Item 34",
        "Item 35",
        "Item 36",
        "Item 37",
        "Item 38",
        "Item 39",
        "Item 40",
        "Item 41",
        "Item 42",
        "Item 43",
        "Item 44",
        "Item 45",
        "Item 46",
        "Item 47",
        "Item 48",
        "Item 49",
        "Item 50"
    ];

    function loadItems() {
        const orderRef = ref(window.firebaseDb, 'eventOrder');
        
        // Listen for changes in real-time
        onValue(orderRef, (snapshot) => {
            if (snapshot.exists()) {
                items = snapshot.val();
            } else {
                items = eventos.map((_, idx) => idx);
            }
            renderList();
        }, (error) => {
            console.error('Error loading order:', error);
            items = eventos.map((_, idx) => idx);
            renderList();
        });
    }

    function renderList() {
        list.innerHTML = '';
        
        // Use filtered events if filters are active
        const eventsToShow = (activeFilters.local || activeFilters.dia) ? filteredEventos : eventos;
        
        items.forEach(eventIdx => {
            const evento = eventos[eventIdx];
            
            // Skip if not in filtered list
            if ((activeFilters.local || activeFilters.dia) && !filteredEventos.includes(evento)) {
                return;
            }
            
            const li = document.createElement('li');
            li.classList.add('sortable-item');
            li.dataset.eventIndex = eventIdx;
            // Arrows box
            const arrowsBox = document.createElement('div');
            arrowsBox.className = 'arrows-box';
            const upBtn = document.createElement('button');
            upBtn.type = 'button';
            upBtn.className = 'arrow up';
            upBtn.textContent = '↑';
            const downBtn = document.createElement('button');
            downBtn.type = 'button';
            downBtn.className = 'arrow down';
            downBtn.textContent = '↓';
            arrowsBox.appendChild(upBtn);
            arrowsBox.appendChild(downBtn);
            // Text box
            const textBox = document.createElement('div');
            textBox.className = 'text-box';
            const textSpan = document.createElement('span');
            textSpan.className = 'item-text';
            textSpan.textContent = evento.nome;
            
            // Badges
            const badgesDiv = document.createElement('div');
            badgesDiv.className = 'badges';
            
            // Badge de tipo
            const tipoBadge = document.createElement('span');
            tipoBadge.className = 'badge tipo';
            tipoBadge.textContent = evento.tipo;
            badgesDiv.appendChild(tipoBadge);

            // Horário de visitação único para todos os dias
            const horarioVisitacao = evento.horario_visitacao || 'A definir';
            const visitaBadge = document.createElement('span');
            visitaBadge.className = 'badge visitacao';
            visitaBadge.textContent = `👟 Visita: ${horarioVisitacao}`;
            badgesDiv.appendChild(visitaBadge);
            
            // Determinar horário de hoje
            const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
            const hoje = diasSemana[new Date().getDay()];
            const horarioHoje = evento.horarios[hoje];
            
            if (horarioHoje && horarioHoje !== 'Fechado') {
                const horarioBadge = document.createElement('span');
                horarioBadge.className = 'badge horario';
                horarioBadge.textContent = `⏰ ${horarioHoje}`;
                badgesDiv.appendChild(horarioBadge);
            } else if (horarioHoje === 'Fechado') {
                const horarioBadge = document.createElement('span');
                horarioBadge.className = 'badge horario';
                horarioBadge.textContent = '🔒 Fechado hoje';
                horarioBadge.style.backgroundColor = '#ffebee';
                horarioBadge.style.color = '#c62828';
                badgesDiv.appendChild(horarioBadge);
            }
            
            // Badge de local
            const localBadge = document.createElement('span');
            localBadge.className = 'badge local';
            localBadge.textContent = `📍 ${evento.local}`;
            badgesDiv.appendChild(localBadge);
            
            textBox.appendChild(textSpan);
            textBox.appendChild(badgesDiv);
            
            // Append to li
            li.appendChild(arrowsBox);
            li.appendChild(textBox);
            list.appendChild(li);
        });
    }

    function saveOrder() {
        const orderRef = ref(window.firebaseDb, 'eventOrder');
        set(orderRef, items)
            .catch(error => console.error('Error saving order:', error));
    }

    list.addEventListener('click', (e) => {
        // Check if clicked element is within a sortable-item but not the arrow buttons
        const li = e.target.closest('.sortable-item');
        if (!li) return;
        
        if (e.target.classList.contains('arrow')) {
            e.preventDefault();
            const index = Array.from(list.children).indexOf(li);
            if (e.target.classList.contains('up') && index > 0) {
                [items[index], items[index - 1]] = [items[index - 1], items[index]];
                renderList();
                saveOrder();
            } else if (e.target.classList.contains('down') && index < items.length - 1) {
                [items[index], items[index + 1]] = [items[index + 1], items[index]];
                renderList();
                saveOrder();
            }
        } else {
            // Click anywhere on the event to open details
            const eventIdx = parseInt(li.dataset.eventIndex);
            const evento = eventos[eventIdx];
            if (evento && typeof evento === 'object') {
                const horarioVisita = evento.horario_visitacao || 'A definir';
                // Images carousel/gallery
                let imagesHtml = '';
                if (evento.imagens && evento.imagens.length > 0) {
                    imagesHtml = '<div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:15px;">';
                    evento.imagens.forEach(img => {
                        imagesHtml += `<img src="${img}" style="width:100%; max-height:150px; object-fit:cover; border-radius:8px;">`;
                    });
                    imagesHtml += '</div>';
                }
                
                let horariosHtml = '<table style="width:100%; margin-top:10px; border-collapse:collapse;"><tr><th style="border:1px solid #ddd; padding:5px;">Dia</th><th style="border:1px solid #ddd; padding:5px;">Horário</th></tr>';
                const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
                const diasTexto = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
                dias.forEach((dia, idx) => {
                    const horario = evento.horarios[dia] || 'N/A';
                    horariosHtml += `<tr><td style="border:1px solid #ddd; padding:5px;">${diasTexto[idx]}</td><td style="border:1px solid #ddd; padding:5px;">${horario}</td></tr>`;
                });
                horariosHtml += '</table>';
                modalContent.innerHTML = `
                    <h3>${evento.nome}</h3>
                    <p style="margin:5px 0; font-size:12px; color:#666;"><strong>Tipo:</strong> ${evento.tipo} | <strong>Bairro:</strong> ${evento.bairro}</p>
                    ${imagesHtml}
                    <p><strong>Descrição:</strong> ${evento.descricao}</p>
                    <p><strong>Local:</strong> ${evento.local}</p>
                    <p><strong>Endereço:</strong> ${evento.endereco}</p>
                    ${evento.distancia_airbnb_m ? `<p><strong>Distância Airbnb:</strong> ${(evento.distancia_airbnb_m / 1000).toFixed(1)}km</p>` : ''}
                    ${evento.site ? `<p><strong>Site:</strong> <a href="${evento.site}" target="_blank">${evento.site}</a></p>` : ''}
                    ${evento.instagram ? `<p><strong>Instagram:</strong> <a href="https://instagram.com/${evento.instagram.replace('@', '')}" target="_blank">${evento.instagram}</a></p>` : ''}
                    <p><strong>Endereço:</strong> ${evento.endereco}</p>
                    <p><strong>Horário de visitação (todos os dias):</strong> ${horarioVisita}</p>
                    <h4>Horários de funcionamento por dia:</h4>
                    ${horariosHtml}
                    <button id="close-modal" style="margin-top:15px; padding:8px 15px; cursor:pointer;">Fechar</button>
                `;
            }
            modal.style.display = 'flex';
            document.getElementById('close-modal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
    });
});