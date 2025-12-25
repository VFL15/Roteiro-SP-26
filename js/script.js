import { ref, set, onValue } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Páginas
    const pageEventos = document.getElementById('page-eventos');
    const pageClassificacao = document.getElementById('page-classificacao');
    const pageMapas = document.getElementById('page-mapas');
    const navButtons = document.querySelectorAll('.nav-item');
    
    // Variáveis globais
    let eventos = [];
    let filteredEventos = [];
    let activeFilters = { tipo: '', bairro: '', dia: '' };
    let items = [];
    const list = document.getElementById('sortable-list');
    const tipoSelect = document.getElementById('edit-tipo');
    const bairroSelect = document.getElementById('edit-bairro');
    const baseTipos = ['passeio', 'ingestão', 'compras'];

    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    const normalizeTipo = (value) => (value || '').toString().trim().toLowerCase();
    const normalizeBairro = (value) => (value || '').toString().trim().toLowerCase();
    
    // Editor de eventos
    let currentEventoIndex = 0;
    let unsavedChanges = false;
    
    // =========================
    // CARREGAR EVENTOS
    // =========================
    const loadEventos = async () => {
        try {
            const response = await fetch('data/eventos.json?v=' + Date.now());
            eventos = await response.json();
            eventos.forEach(ev => {
                ev.tipo = normalizeTipo(ev.tipo);
                ensureBairroOption(ev.bairro);
            });
            filteredEventos = eventos;
            // Garantir que tipos existentes apareçam no select
            eventos.forEach(ev => ensureTipoOption(ev.tipo));
            
            // Atualizar editor
            if (document.getElementById('eventoTotal')) {
                document.getElementById('eventoTotal').textContent = eventos.length;
            }
            if (eventos.length > 0) displayEvento(0);
            
            // Atualizar classificação
            populateFilterOptions();
            loadItems();
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
        }
    };

    const ensureTipoOption = (value) => {
        const val = normalizeTipo(value);
        if (!val || val === '__custom') return;
        if (!tipoSelect) return;
        const exists = Array.from(tipoSelect.options).some(o => normalizeTipo(o.value) === val);
        if (!exists) {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = capitalize(val);
            const customOpt = tipoSelect.querySelector('option[value="__custom"]');
            tipoSelect.insertBefore(opt, customOpt || null);
        }
    };

    const ensureBairroOption = (value) => {
        const raw = (value || '').toString().trim();
        const val = normalizeBairro(raw);
        if (!raw || raw === '__custom') return;
        if (!bairroSelect) return;
        const exists = Array.from(bairroSelect.options).some(o => normalizeBairro(o.value) === val);
        if (!exists) {
            const opt = document.createElement('option');
            opt.value = raw;
            opt.textContent = capitalize(raw) || capitalize(val);
            const customOpt = bairroSelect.querySelector('option[value="__custom"]');
            bairroSelect.insertBefore(opt, customOpt || null);
        }
    };
    
    // =========================
    // EDITOR DE EVENTOS
    // =========================
    const displayEvento = (index) => {
        if (index < 0) index = eventos.length - 1;
        if (index >= eventos.length) index = 0;
        currentEventoIndex = index;
        const evento = eventos[index];
        
        document.getElementById('eventoNumber').textContent = index + 1;
        document.getElementById('edit-nome').value = evento.nome || '';
        document.getElementById('edit-descricao').value = evento.descricao || '';
        const tipoVal = normalizeTipo(evento.tipo);
        ensureTipoOption(tipoVal);
        if (tipoSelect) tipoSelect.value = tipoVal || '';
        ensureBairroOption(evento.bairro);
        if (bairroSelect) bairroSelect.value = (evento.bairro || '');
        document.getElementById('edit-endereco').value = evento.endereco || '';
        document.getElementById('edit-horario-visitacao').value = evento.horario_visitacao || '';
        
        // Horários de funcionamento
        document.getElementById('edit-quinta').value = evento.horarios_funcionamento?.quinta || '';
        document.getElementById('edit-sexta').value = evento.horarios_funcionamento?.sexta || '';
        document.getElementById('edit-sabado').value = evento.horarios_funcionamento?.sabado || '';
        document.getElementById('edit-domingo').value = evento.horarios_funcionamento?.domingo || '';
        document.getElementById('edit-reservar').value = evento.reservar || 'não';
        document.getElementById('edit-reserva').value = evento.reserva || '';
        document.getElementById('edit-site').value = evento.site || '';
        document.getElementById('edit-instagram').value = evento.instagram || '';
        
        unsavedChanges = false;
        const saveBtn = document.getElementById('saveEvento');
        saveBtn.style.opacity = '0.5';
        saveBtn.style.pointerEvents = 'none';
    };
    
    const saveEvento = () => {
        const evento = eventos[currentEventoIndex];
        evento.nome = document.getElementById('edit-nome').value;
        evento.descricao = document.getElementById('edit-descricao').value;
        evento.tipo = normalizeTipo(tipoSelect?.value || '');
        evento.bairro = bairroSelect?.value || '';
        evento.endereco = document.getElementById('edit-endereco').value;
        evento.horario_visitacao = document.getElementById('edit-horario-visitacao').value;
        
        // Horários de funcionamento
        evento.horarios_funcionamento = {
            quinta: document.getElementById('edit-quinta').value || '',
            sexta: document.getElementById('edit-sexta').value || '',
            sabado: document.getElementById('edit-sabado').value || '',
            domingo: document.getElementById('edit-domingo').value || ''
        };
        evento.reservar = document.getElementById('edit-reservar').value;
        evento.reserva = document.getElementById('edit-reserva').value;
        evento.site = document.getElementById('edit-site').value;
        evento.instagram = document.getElementById('edit-instagram').value;
        
        localStorage.setItem('eventosEditados', JSON.stringify(eventos));
        
        unsavedChanges = false;
        const saveBtn = document.getElementById('saveEvento');
        saveBtn.style.opacity = '0.5';
        saveBtn.style.pointerEvents = 'none';
        alert(`✓ ${evento.nome} salvo (sessão local)`);
    };
    
    // Event listeners do editor
    document.getElementById('prevEvento')?.addEventListener('click', () => {
        if (unsavedChanges && !confirm('Há mudanças não salvas. Descartar?')) return;
        displayEvento(currentEventoIndex - 1);
    });
    
    document.getElementById('nextEvento')?.addEventListener('click', () => {
        if (unsavedChanges && !confirm('Há mudanças não salvas. Descartar?')) return;
        displayEvento(currentEventoIndex + 1);
    });
    
    document.getElementById('saveEvento')?.addEventListener('click', saveEvento);
    document.getElementById('resetEvento')?.addEventListener('click', () => displayEvento(currentEventoIndex));
    
    const handleTipoChange = () => {
        if (!tipoSelect) return;
        const val = tipoSelect.value;
        if (val === '__custom') {
            const novo = prompt('Digite o novo tipo:');
            if (!novo) {
                const fallback = eventos[currentEventoIndex]?.tipo || baseTipos[0];
                const fb = normalizeTipo(fallback);
                ensureTipoOption(fb);
                tipoSelect.value = fb;
                return;
            }
            const finalVal = normalizeTipo(novo);
            ensureTipoOption(finalVal);
            tipoSelect.value = finalVal;
        }
        unsavedChanges = true;
        const saveBtn = document.getElementById('saveEvento');
        saveBtn.style.opacity = '1';
        saveBtn.style.pointerEvents = 'auto';
    };
    tipoSelect?.addEventListener('change', handleTipoChange);

    const handleBairroChange = () => {
        if (!bairroSelect) return;
        const val = bairroSelect.value;
        if (val === '__custom') {
            const novo = prompt('Digite o novo bairro:');
            if (!novo) {
                const fallback = eventos[currentEventoIndex]?.bairro || '';
                ensureBairroOption(fallback);
                bairroSelect.value = fallback;
                return;
            }
            const finalVal = novo.trim();
            ensureBairroOption(finalVal);
            bairroSelect.value = finalVal;
        }
        unsavedChanges = true;
        const saveBtn = document.getElementById('saveEvento');
        saveBtn.style.opacity = '1';
        saveBtn.style.pointerEvents = 'auto';
    };
    bairroSelect?.addEventListener('change', handleBairroChange);

    // Detectar mudanças
    ['edit-nome', 'edit-descricao', 'edit-endereco', 'edit-horario-visitacao',
     'edit-quinta', 'edit-sexta', 'edit-sabado', 'edit-domingo',
     'edit-reservar', 'edit-reserva', 'edit-site', 'edit-instagram']
        .forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                unsavedChanges = true;
                const saveBtn = document.getElementById('saveEvento');
                saveBtn.style.opacity = '1';
                saveBtn.style.pointerEvents = 'auto';
            });
        });
    
    // =========================
    // NAVEGAÇÃO ENTRE PÁGINAS
    // =========================
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPage = btn.getAttribute('data-page');
            
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            pageEventos.classList.remove('active');
            pageClassificacao.classList.remove('active');
            pageMapas.classList.remove('active');
            
            if (targetPage === 'eventos') {
                pageEventos.classList.add('active');
            } else if (targetPage === 'classificacao') {
                pageClassificacao.classList.add('active');
            } else if (targetPage === 'mapas') {
                pageMapas.classList.add('active');
            }
        });
    });

    // =========================
    // FILTROS
    // =========================
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
        activeFilters.bairro = filterLocal.value;
        activeFilters.dia = filterDia.value;
        applyFilters();
        filterPanel.classList.remove('active');
    });

    clearFiltersBtn.addEventListener('click', () => {
        filterTipo.value = '';
        filterLocal.value = '';
        filterDia.value = '';
        activeFilters.tipo = '';
        activeFilters.bairro = '';
        activeFilters.dia = '';
        applyFilters();
        filterPanel.classList.remove('active');
    });

    function applyFilters() {
        filteredEventos = eventos.filter(evento => {
            let matchTipo = !activeFilters.tipo || evento.tipo === activeFilters.tipo;
            let matchBairro = !activeFilters.bairro || evento.bairro === activeFilters.bairro;
            let matchDia = !activeFilters.dia || (evento.horarios_funcionamento[activeFilters.dia] && evento.horarios_funcionamento[activeFilters.dia] !== 'Fechado');
            return matchTipo && matchBairro && matchDia;
        });
        renderList();
    }

    function populateFilterOptions() {
        // Limpar opções antigas
        filterTipo.innerHTML = '<option value="">Todos</option>';
        filterLocal.innerHTML = '<option value="">Todos</option>';
        
        // Populate tipo filter
        const tipos = [...new Set(eventos.map(e => normalizeTipo(e.tipo)))].sort();
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = capitalize(tipo);
            filterTipo.appendChild(option);
        });

        // Populate bairro filter
        const bairros = [...new Map(eventos.map(e => [normalizeBairro(e.bairro), e.bairro])).values()];
        bairros.forEach(bairro => {
            const option = document.createElement('option');
            option.value = bairro;
            option.textContent = capitalize(bairro) || bairro;
            filterLocal.appendChild(option);
        });
    }

    // =========================
    // CLASSIFICAÇÃO
    // =========================
    function loadItems() {
        const orderRef = ref(window.firebaseDb, 'eventOrder');
        
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
        if (!list) return;
        list.innerHTML = '';
        
        const eventsToShow = (activeFilters.bairro || activeFilters.dia) ? filteredEventos : eventos;
        
        items.forEach(eventIdx => {
            const evento = eventos[eventIdx];
            if (!evento) return;
            
            if ((activeFilters.bairro || activeFilters.dia) && !filteredEventos.includes(evento)) {
                return;
            }
            
            const li = document.createElement('li');
            li.classList.add('sortable-item');
            li.dataset.eventIndex = eventIdx;
            
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
            
            const textBox = document.createElement('div');
            textBox.className = 'text-box';
            const textSpan = document.createElement('span');
            textSpan.className = 'item-text';
            textSpan.textContent = evento.nome;
            
            const badgesDiv = document.createElement('div');
            badgesDiv.className = 'badges';
            
            const tipoBadge = document.createElement('span');
            tipoBadge.className = 'badge tipo';
            tipoBadge.textContent = evento.tipo;
            badgesDiv.appendChild(tipoBadge);

            const horarioVisitacao = evento.horario_visitacao || 'A definir';
            const visitaBadge = document.createElement('span');
            visitaBadge.className = 'badge visitacao';
            visitaBadge.textContent = `👟 Visita: ${horarioVisitacao}`;
            badgesDiv.appendChild(visitaBadge);
            
            const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
            const hoje = diasSemana[new Date().getDay()];
            const horarioHoje = evento.horarios_funcionamento?.[hoje];
            
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
            
            const bairroBadge = document.createElement('span');
            bairroBadge.className = 'badge local';
            bairroBadge.textContent = `📍 ${evento.bairro}`;
            badgesDiv.appendChild(bairroBadge);
            
            textBox.appendChild(textSpan);
            textBox.appendChild(badgesDiv);
            
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

    // =========================
    // MODAL DE DETALHES
    // =========================
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
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflowY = 'auto';

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
        }
    });

    // =========================
    // EVENTOS DA LISTA
    // =========================
    list?.addEventListener('click', (e) => {
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
            const eventIdx = parseInt(li.dataset.eventIndex);
            const evento = eventos[eventIdx];
            if (evento && typeof evento === 'object') {
                const horarioVisita = evento.horario_visitacao || 'A definir';
                
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
                    const horario = evento.horarios_funcionamento?.[dia] || 'N/A';
                    horariosHtml += `<tr><td style="border:1px solid #ddd; padding:5px;">${diasTexto[idx]}</td><td style="border:1px solid #ddd; padding:5px;">${horario}</td></tr>`;
                });
                horariosHtml += '</table>';
                
                modalContent.innerHTML = `
                    <h3>${evento.nome}</h3>
                    <p style="margin:5px 0; font-size:12px; color:#666;"><strong>Tipo:</strong> ${evento.tipo} | <strong>Bairro:</strong> ${evento.bairro}</p>
                    ${imagesHtml}
                    <p><strong>Descrição:</strong> ${evento.descricao}</p>
                    <p><strong>Endereço:</strong> ${evento.endereco}</p>
                    ${evento.distancia_airbnb_m ? `<p><strong>Distância Airbnb:</strong> ${(evento.distancia_airbnb_m / 1000).toFixed(1)}km</p>` : ''}
                    ${evento.site ? `<p><strong>Site:</strong> <a href="${evento.site}" target="_blank">${evento.site}</a></p>` : ''}
                    ${evento.instagram ? `<p><strong>Instagram:</strong> <a href="https://instagram.com/${evento.instagram.replace('@', '')}" target="_blank">${evento.instagram}</a></p>` : ''}
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
    
    // =========================
    // INICIALIZAÇÃO
    // =========================
    const savedData = localStorage.getItem('eventosEditados');
    if (savedData) {
        eventos = JSON.parse(savedData);
        eventos.forEach(ev => { ev.tipo = normalizeTipo(ev.tipo); });
        eventos.forEach(ev => ensureBairroOption(ev.bairro));
        filteredEventos = eventos;
        if (eventos.length > 0 && document.getElementById('eventoTotal')) {
            document.getElementById('eventoTotal').textContent = eventos.length;
            displayEvento(0);
        }
        populateFilterOptions();
        loadItems();
    } else {
        await loadEventos();
    }
});
