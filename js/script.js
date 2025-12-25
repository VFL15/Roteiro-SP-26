import { ref, set, onValue, update } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Páginas
    const pageEventos = document.getElementById('page-eventos');
    const pageClassificacao = document.getElementById('page-classificacao');
    const pageRoteiro = document.getElementById('page-roteiro');
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
    let isSyncingFromFirebase = false; // Flag para evitar loops infinitos
    let midiaManifest = null; // Manifesto de mídia por evento

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
            // Carregar manifesto de mídia
            try {
                const manifestResp = await fetch('data/midia_manifest.json?v=' + Date.now());
                if (manifestResp.ok) {
                    midiaManifest = await manifestResp.json();
                }
            } catch (e) {
                console.warn('Manifesto de mídia não disponível. Usando placeholder quando necessário.');
            }
            eventos.forEach(ev => {
                ev.tipo = normalizeTipo(ev.tipo);
                ensureBairroOption(ev.bairro);
                // Aplicar imagens do manifesto se não houver imagens definidas
                if ((!ev.imagens || ev.imagens.length === 0) && midiaManifest) {
                    const imgs = midiaManifest[ev.nome] || midiaManifest?.__placeholder__ || [];
                    ev.imagens = imgs;
                }
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
            
            // Sincronizar mudanças em tempo real do Firebase
            setupFirebaseSync();
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
    
    const setupFirebaseSync = () => {
        // Escutar mudanças em todos os eventos
        const eventosRef = ref(window.firebaseDb, 'eventos');
        onValue(eventosRef, (snapshot) => {
            if (!snapshot.exists()) return;
            
            const firebaseEventos = snapshot.val();
            
            // Atualizar apenas os eventos que foram alterados no Firebase
            for (let i = 0; i < eventos.length; i++) {
                if (firebaseEventos[i] && isSyncingFromFirebase === false) {
                    // Comparar para detectar mudanças
                    const hasChanges = JSON.stringify(eventos[i]) !== JSON.stringify(firebaseEventos[i]);
                    if (hasChanges) {
                        isSyncingFromFirebase = true;
                        eventos[i] = { ...firebaseEventos[i] };
                        
                        // Se o evento atual está sendo visualizado, atualizar o formulário
                        if (currentEventoIndex === i) {
                            displayEvento(i);
                        }
                        
                        // Atualizar a página de classificação se estiver visível
                        const classificacaoTab = document.querySelector('[data-tab="classificacao"]');
                        if (classificacaoTab?.classList.contains('active')) {
                            renderList();
                        }
                        
                        isSyncingFromFirebase = false;
                    }
                }
            }
            
            localStorage.setItem('eventosEditados', JSON.stringify(eventos));
        }, (error) => {
            console.error('Erro ao sincronizar eventos do Firebase:', error);
        });
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
        
        // Sincronizar com Firebase
        const eventoRef = ref(window.firebaseDb, `eventos/${currentEventoIndex}`);
        set(eventoRef, evento)
            .then(() => {
                unsavedChanges = false;
                const saveBtn = document.getElementById('saveEvento');
                saveBtn.style.opacity = '0.5';
                saveBtn.style.pointerEvents = 'none';
                alert(`✓ ${evento.nome} salvo e sincronizado!`);
            })
            .catch(error => {
                console.error('Erro ao sincronizar com Firebase:', error);
                alert('⚠️ Salvo localmente, mas falha na sincronização remota.');
            });
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
            pageRoteiro.classList.remove('active');
            pageMapas.classList.remove('active');
            
            if (targetPage === 'eventos') {
                pageEventos.classList.add('active');
            } else if (targetPage === 'classificacao') {
                pageClassificacao.classList.add('active');
            } else if (targetPage === 'roteiro') {
                pageRoteiro.classList.add('active');
                gerarRoteiros();
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
            
            const bairroBadge = document.createElement('span');
            bairroBadge.className = 'badge local';
            bairroBadge.textContent = `📍 ${evento.bairro}`;
            badgesDiv.appendChild(bairroBadge);
            
            textBox.appendChild(textSpan);
            textBox.appendChild(badgesDiv);
            
            li.appendChild(arrowsBox);
            li.appendChild(textBox);
            
            // Abrir modal ao clicar no item
            li.addEventListener('click', (e) => {
                if (!e.target.closest('.arrow')) {
                    abrirModalDetalhes(eventIdx);
                }
            });
            
            list.appendChild(li);
        });
    }

    function saveOrder() {
        const orderRef = ref(window.firebaseDb, 'eventOrder');
        set(orderRef, items)
            .catch(error => console.error('Error saving order:', error));
    }

    const abrirModalDetalhes = (eventoIdx) => {
        const evento = eventos[eventoIdx];
        if (!evento) return;
        
        // Construir HTML com horários de funcionamento
        let horariosFuncionamento = '<div style="font-size: 12px; color: #666; margin-top: 12px;">';
        horariosFuncionamento += '<strong>⏰ Horários de Funcionamento:</strong><br>';
        const dias = ['quinta', 'sexta', 'sabado', 'domingo'];
        dias.forEach(dia => {
            const horario = evento.horarios_funcionamento?.[dia] || 'Não informado';
            horariosFuncionamento += `<strong>${capitalize(dia)}:</strong> ${horario}<br>`;
        });
        horariosFuncionamento += '</div>';

        modalContent.innerHTML = `
            <h2 style="margin-top: 0; color: #9F3132;">${evento.nome}</h2>
            
            ${evento.descricao ? `<p style="color: #666; margin: 8px 0;">${evento.descricao}</p>` : ''}
            
            <div style="margin-top: 12px; font-size: 13px; line-height: 1.6;">
                <strong>Tipo:</strong> ${evento.tipo}<br>
                <strong>Bairro:</strong> ${evento.bairro}<br>
                📍 ${evento.endereco || 'Não informado'}<br>
                ${evento.site ? `🌐 <a href="${evento.site}" target="_blank">${evento.site}</a><br>` : ''}
                ${evento.instagram ? `📷 <a href="https://instagram.com/${evento.instagram.replace('@', '')}" target="_blank">${evento.instagram}</a><br>` : ''}
                <strong>Reserva:</strong> ${evento.reservar === 'sim' ? 'Necessária' : 'Não necessária'}<br>
                ${evento.reserva ? `<strong>Link:</strong> <a href="${evento.reserva}" target="_blank">Reservar</a><br>` : ''}
            </div>
            
            ${horariosFuncionamento}
            
            <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin: 12px 0;">
                <strong style="color: #9F3132;">👟 Horário de Visitação:</strong><br>
                <span style="font-size: 16px; color: #D4AF37;">${evento.horario_visitacao || 'A definir'}</span>
            </div>
            
            ${evento.distancia_airbnb_m ? `<div style="margin-top: 12px; font-size: 13px;">🏠 <strong>Distância Airbnb:</strong> ${(evento.distancia_airbnb_m / 1000).toFixed(1)}km</div>` : ''}
            
            <button id="closeModal" style="margin-top: 16px; padding: 10px 20px; background: #9F3132; color: white; border: none; border-radius: 6px; cursor: pointer;">Fechar</button>
        `;

        document.getElementById('closeModal').addEventListener('click', fecharModal);
        modal.style.display = 'flex';
    };

    const fecharModal = () => {
        modal.style.display = 'none';
    };

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
                const dias = ['quinta', 'sexta', 'sabado', 'domingo'];
                const diasTexto = ['Quinta', 'Sexta', 'Sábado', 'Domingo'];
                dias.forEach((dia, idx) => {
                    const horario = evento.horarios_funcionamento?.[dia] || 'N/A';
                    horariosHtml += `<tr><td style="border:1px solid #ddd; padding:5px;">${diasTexto[idx]}</td><td style="border:1px solid #ddd; padding:5px;">${horario}</td></tr>`;
                });
                horariosHtml += '</table>';
                
                modalContent.innerHTML = `
                    <h3 style="margin-top: 0; color: #9F3132;">${evento.nome}</h3>
                    <p style="margin:5px 0 12px 0; font-size:12px; color:#000;"><strong>Tipo:</strong> ${capitalize(evento.tipo)} | <strong>Bairro:</strong> ${evento.bairro}</p>
                    
                    <!-- Abas -->
                    <div style="display: flex; gap: 12px; margin: 16px 0; border-bottom: 2px solid #ddd;">
                        <button class="modal-tab active" data-tab="midia" style="padding: 8px 16px; background: none; border: none; border-bottom: 3px solid #9F3132; color: #9F3132; font-weight: bold; cursor: pointer;">📸 Mídia</button>
                        <button class="modal-tab" data-tab="info" style="padding: 8px 16px; background: none; border: none; border-bottom: 3px solid transparent; color: #666; font-weight: bold; cursor: pointer;">ℹ️ Informações</button>
                    </div>
                    
                    <!-- Aba Mídia -->
                    <div class="modal-tab-content" id="tab-midia" style="display: block;">
                        ${evento.imagens && evento.imagens.length > 0 ? imagesHtml : '<p style="color: #999; text-align: center;">Nenhuma imagem disponível</p>'}
                    </div>
                    
                    <!-- Aba Informações -->
                    <div class="modal-tab-content" id="tab-info" style="display: none;">
                        ${evento.descricao ? `<p style="color: #666; margin: 8px 0;">${evento.descricao}</p>` : ''}
                        
                        <div style="margin-top: 12px; font-size: 13px; line-height: 1.6;">
                            📍 ${evento.endereco || 'Não informado'}<br>
                            ${evento.site ? `🌐 <a href="${evento.site}" target="_blank">${evento.site}</a><br>` : ''}
                            ${evento.instagram ? `@ <a href="https://instagram.com/${evento.instagram.replace('@', '')}" target="_blank">${evento.instagram.replace('@', '')}</a><br>` : ''}
                            <strong>Reserva:</strong> ${evento.reservar === 'sim' ? 'Necessária' : 'Não necessária'}
                            ${evento.reserva ? ` - <a href="${evento.reserva}" target="_blank" rel="noopener noreferrer">Reservar</a>` : ''}<br>
                        </div>
                        
                        <div style="font-size: 12px; margin-top: 12px; text-align: center;">
                            <strong style="color: #000;">Horários de Funcionamento:</strong><br>
                            <table style="width:100%; margin-top:10px; border-collapse:collapse;">
                                <tr>
                                    <th style="border:1px solid #ddd; padding:5px; color: #000;">Dia</th>
                                    <th style="border:1px solid #ddd; padding:5px; color: #000;">Horário</th>
                                </tr>
                                ${dias.map((dia, idx) => {
                                    const horario = evento.horarios_funcionamento?.[dia] || 'N/A';
                                    return `<tr><td style="border:1px solid #ddd; padding:5px; color: #000;">${diasTexto[idx]}</td><td style="border:1px solid #ddd; padding:5px; color: #000;">${horario}</td></tr>`;
                                }).join('')}
                            </table>
                        </div>
                        
                        <div style="font-size: 12px; margin-top: 12px; text-align: center;">
                            <strong style="color: #000;">Horário de Visitação:</strong><br>
                            <span style="font-size: 14px; color: #000; margin-top: 8px; display: inline-block;">${horarioVisita}</span>
                        </div>
                        
                        ${evento.distancia_airbnb_m ? `<div style="margin-top: 12px; font-size: 13px;">🏠 ${(evento.distancia_airbnb_m / 1000).toFixed(1)}km</div>` : ''}
                    </div>
                    
                    <button id="close-modal" style="margin-top:15px; padding:8px 15px; background: #9F3132; color: white; border: none; border-radius: 6px; cursor:pointer; width: 100%;">Fechar</button>
                `;
                
                // Setup das abas
                const tabButtons = modalContent.querySelectorAll('.modal-tab');
                tabButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const tabName = e.target.dataset.tab;
                        
                        // Remover ativo de todos
                        tabButtons.forEach(b => {
                            b.classList.remove('active');
                            b.style.borderBottomColor = 'transparent';
                            b.style.color = '#666';
                        });
                        
                        // Ativar clicado
                        e.target.classList.add('active');
                        e.target.style.borderBottomColor = '#9F3132';
                        e.target.style.color = '#9F3132';
                        
                        // Esconder todos os conteúdos
                        modalContent.querySelectorAll('.modal-tab-content').forEach(content => {
                            content.style.display = 'none';
                        });
                        
                        // Mostrar o selecionado
                        const activeContent = document.getElementById(`tab-${tabName}`);
                        if (activeContent) {
                            activeContent.style.display = 'block';
                        }
                    });
                });
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
        // Carregar manifesto de mídia e aplicar se necessário
        try {
            const manifestResp = await fetch('data/midia_manifest.json?v=' + Date.now());
            if (manifestResp.ok) {
                midiaManifest = await manifestResp.json();
                eventos.forEach(ev => {
                    if ((!ev.imagens || ev.imagens.length === 0) && midiaManifest) {
                        const imgs = midiaManifest[ev.nome] || midiaManifest?.__placeholder__ || [];
                        ev.imagens = imgs;
                    }
                });
            }
        } catch (e) {
            console.warn('Manifesto de mídia não disponível no carregamento inicial.');
        }
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

    // =========================
    // FUNÇÕES DE ROTEIRO
    // =========================
    
    const gerarRoteiros = () => {
        const diasOrdenados = ['quinta', 'sexta', 'sabado', 'domingo'];
        const roteiros = {};
        
        // Inicializar roteiros vazios
        diasOrdenados.forEach(dia => {
            roteiros[dia] = [];
        });
        
        // Obter eventos ordenados por classificação (order no sortable-list)
        const itemsOrdenados = [...items].sort((a, b) => a.order - b.order);
        
        // Para cada evento, tentar encaixar em cada dia
        itemsOrdenados.forEach(item => {
            const evento = eventos[item.index];
            if (!evento) return;
            
            // Tentar encaixar em cada dia
            for (let dia of diasOrdenados) {
                const horarioFunc = evento.horarios_funcionamento?.[dia];
                const horarioVisita = evento.horario_visitacao;
                
                // Se tem horário de funcionamento e horário de visita
                if (horarioFunc && horarioVisita) {
                    // Verificar se consegue encaixar
                    if (podeEncaixar(horarioVisita, roteiros[dia])) {
                        roteiros[dia].push({
                            index: item.index,
                            evento: evento,
                            horario: horarioVisita,
                            order: item.order
                        });
                        return; // Já encaixou, sair do loop
                    }
                }
            }
        });
        
        // Renderizar roteiros
        diasOrdenados.forEach(dia => {
            renderizarRoteiroDia(dia, roteiros[dia]);
        });
        
        // Setup das abas
        setupAbas();
    };
    
    const podeEncaixar = (horarioVisita, roteiroDia) => {
        // Verificar se o horário não conflita com eventos já no roteiro
        // Por enquanto, permite adicionar (desconsiderando tempo de deslocamento)
        
        const [horaStr, minutoStr] = horarioVisita.split(':');
        const hora = parseInt(horaStr);
        
        // Se não há eventos no dia, pode encaixar
        if (roteiroDia.length === 0) return true;
        
        // Verificar se o horário vem após todos os eventos anteriores
        // (simplista, não considera duração do evento)
        const ultimoEvento = roteiroDia[roteiroDia.length - 1];
        const [ultimaHoraStr] = ultimoEvento.horario.split(':');
        const ultimaHora = parseInt(ultimaHoraStr);
        
        return hora > ultimaHora; // Encaixa se for depois do último
    };
    
    const renderizarRoteiroDia = (dia, roteirosDodia) => {
        const container = document.querySelector(`#roteiro-${dia} .roteiro-list`);
        container.innerHTML = '';
        
        if (roteirosDodia.length === 0) {
            container.innerHTML = '<div class="roteiro-vazio">Nenhum evento para este dia</div>';
            return;
        }
        
        roteirosDodia.forEach(item => {
            const div = document.createElement('div');
            div.className = 'roteiro-item';
            div.innerHTML = `
                <div class="roteiro-item-horario">${item.horario}</div>
                <div class="roteiro-item-nome">${item.evento.nome}</div>
                <div class="roteiro-item-endereco">${item.evento.endereco || 'Endereço não informado'}</div>
                <span class="roteiro-item-tipo">${capitalize(item.evento.tipo || '')}</span>
            `;
            container.appendChild(div);
        });
    };
    
    const setupAbas = () => {
        const tabs = document.querySelectorAll('.dia-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.roteiro-dia').forEach(d => d.classList.remove('active'));
                document.getElementById(`roteiro-${tab.dataset.dia}`).classList.add('active');
            });
        });
    };
});
