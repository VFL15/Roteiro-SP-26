import { ref, set, get, onValue } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js';

document.addEventListener('DOMContentLoaded', () => {
    const list = document.querySelector('.sortable-list');
    let draggedElement = null;
    let eventos = [];

    fetch('data/eventos.json')
        .then(response => response.json())
        .then(data => {
            eventos = data;
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
        items.forEach(eventIdx => {
            const evento = eventos[eventIdx];
            const li = document.createElement('li');
            li.classList.add('sortable-item');
            li.draggable = true;
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
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Info';
            textBox.appendChild(textSpan);
            textBox.appendChild(editBtn);
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

    let draggingItem = null;
    const dropIndicator = document.querySelector('.drop-indicator');

    // Evento disparado quando o usuário começa a arrastar um item
    list.addEventListener('dragstart', (e) => {
        draggingItem = e.target;
        e.target.classList.add('dragging');
        const rect = e.target.getBoundingClientRect();
        e.target.style.position = 'absolute';
        e.target.style.left = (e.clientX - rect.width / 2) + 'px';
        e.target.style.top = e.clientY + 'px';
        e.target.style.width = rect.width + 'px';
        e.target.style.zIndex = '1000';
    });

    // Evento disparado quando o usuário termina de arrastar um item
    list.addEventListener('dragend', (e) => {
        if (draggingItem) {
            draggingItem.style.position = '';
            draggingItem.style.left = '';
            draggingItem.style.top = '';
            draggingItem.style.width = '';
            draggingItem.style.zIndex = '';
            draggingItem.classList.remove('dragging');
        }
        draggingItem = null;
        // Update the items array based on current order
        const newItems = Array.from(list.children).map(li => parseInt(li.dataset.eventIndex));
        items = newItems;
        saveOrder();
    });

    // Função para determinar qual item está abaixo do cursor durante o arrasto
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.sortable-item:not(.dragging):not(.placeholder)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            // Se o offset for negativo e mais próximo de 0, é o elemento logo abaixo
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function updateDropIndicator(afterElement) {
        if (afterElement) {
            const rect = afterElement.getBoundingClientRect();
            dropIndicator.style.top = rect.top + 'px';
            dropIndicator.style.display = 'block';
        } else {
            const listRect = list.getBoundingClientRect();
            dropIndicator.style.top = listRect.bottom + 'px';
            dropIndicator.style.display = 'block';
        }
    }

    // Touch events for mobile
    list.addEventListener('touchstart', (e) => {
        draggingItem = e.target.closest('.sortable-item');
        if (!draggingItem) return;
        draggingItem.classList.add('dragging');
        const rect = draggingItem.getBoundingClientRect();
        draggingItem.style.position = 'absolute';
        draggingItem.style.left = (e.touches[0].clientX - rect.width / 2) + 'px';
        draggingItem.style.top = e.touches[0].clientY + 'px';
        draggingItem.style.width = rect.width + 'px';
        draggingItem.style.zIndex = '1000';
        // Insert placeholder
        const placeholder = document.createElement('li');
        placeholder.className = 'sortable-item placeholder';
        placeholder.style.height = rect.height + 'px';
        placeholder.style.visibility = 'hidden';
        list.insertBefore(placeholder, draggingItem);
    });

    list.addEventListener('touchmove', (e) => {
        if (!draggingItem) return;
        e.preventDefault();
        const touch = e.touches[0];
        draggingItem.style.left = (touch.clientX - draggingItem.offsetWidth / 2) + 'px';
        draggingItem.style.top = touch.clientY + 'px';
        const afterElement = getDragAfterElement(list, touch.clientY);
        updateDropIndicator(afterElement);
    });

    list.addEventListener('touchend', (e) => {
        if (!draggingItem) return;
        draggingItem.style.position = '';
        draggingItem.style.left = '';
        draggingItem.style.top = '';
        draggingItem.style.width = '';
        draggingItem.style.zIndex = '';
        draggingItem.classList.remove('dragging');
        const touch = e.changedTouches[0];
        const afterElement = getDragAfterElement(list, touch.clientY);
        // Remove placeholder
        const placeholder = list.querySelector('.placeholder');
        if (placeholder) placeholder.remove();
        dropIndicator.style.display = 'none';
        if (afterElement == null) {
            list.appendChild(draggingItem);
        } else {
            list.insertBefore(draggingItem, afterElement);
        }
        const newItems = Array.from(list.children).map(li => parseInt(li.dataset.eventIndex));
        items = newItems;
        saveOrder();
        draggingItem = null;
    });

    // For desktop, allow drop anywhere
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggingItem) {
            draggingItem.style.left = (e.clientX - draggingItem.offsetWidth / 2) + 'px';
            draggingItem.style.top = e.clientY + 'px';
            const afterElement = getDragAfterElement(list, e.clientY);
            updateDropIndicator(afterElement);
        }
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggingItem) {
            const afterElement = getDragAfterElement(list, e.clientY);
            if (afterElement == null) {
                list.appendChild(draggingItem);
            } else {
                list.insertBefore(draggingItem, afterElement);
            }
        }
    });

    list.addEventListener('click', (e) => {
        if (e.target.classList.contains('arrow')) {
            e.preventDefault();
            const li = e.target.closest('.sortable-item');
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
        } else if (e.target.classList.contains('edit-btn')) {
            const li = e.target.closest('.sortable-item');
            const eventIdx = parseInt(li.dataset.eventIndex);
            const evento = eventos[eventIdx];
            if (evento && typeof evento === 'object') {
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
                    <p><strong>Local:</strong> ${evento.local}</p>
                    <p><strong>Endereço:</strong> ${evento.endereco}</p>
                    <h4>Horários por Dia:</h4>
                    ${horariosHtml}
                    <button id="close-modal" style="margin-top:15px; padding:8px 15px; cursor:pointer;">Fechar</button>
                `;
            } else {
                modalContent.innerHTML = `<h3>${items[index]}</h3><button id="close-modal">Fechar</button>`;
            }
            modal.style.display = 'flex';
            document.getElementById('close-modal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
    });
});