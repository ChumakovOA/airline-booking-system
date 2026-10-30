document.addEventListener('DOMContentLoaded', function() {
    // Конфигурация
    const API_URL = 'http://localhost:3000/api';
    const FLIGHT_ID = 1;
    const PASSENGER_ID = 1;
    
    // Переменные состояния
    let selectedSeat = null;
    let currentBooking = null;
    let seatsData = [];
    
    // Элементы
    const loading = document.getElementById('loading');
    const airplaneMap = document.getElementById('airplane-map');
    const serverStatus = document.getElementById('server-status');
    const dbStatus = document.getElementById('db-status');
    const flightDetails = document.getElementById('flight-details');
    const flightInfo = document.getElementById('flight-info');
    
    // Кнопки
    const btnBook = document.getElementById('btn-book');
    const btnReset = document.getElementById('btn-reset');
    const btnDemo = document.getElementById('btn-demo');
    
    // Информационные элементы
    const selectedSeatEl = document.getElementById('selected-seat');
    const seatClassEl = document.getElementById('seat-class');
    const seatPriceEl = document.getElementById('seat-price');
    const seatStatusEl = document.getElementById('seat-status');
    
    // Статистика
    const statFlights = document.getElementById('stat-flights');
    const statPassengers = document.getElementById('stat-passengers');
    const statBookings = document.getElementById('stat-bookings');
    const statSeats = document.getElementById('stat-seats');
    
    // Инициализация системы
    init();
    
    async function init() {
        console.log('🚀 Инициализация системы бронирования...');
        showLoading('Проверка подключения к серверу...');
        
        // 1. Проверяем сервер
        try {
            const response = await fetch(`${API_URL}/test`);
            const data = await response.json();
            
            if (data.success) {
                serverStatus.textContent = '✅ Сервер подключен';
                serverStatus.style.background = '#27ae60';
                console.log('✅ Сервер доступен:', data.message);
                
                // 2. Загружаем статистику
                await loadStats();
                
                // 3. Загружаем места
                await loadSeats();
                
            } else {
                throw new Error('Сервер вернул ошибку');
            }
        } catch (error) {
            console.error('❌ Сервер недоступен:', error);
            showError('Сервер не отвечает. Проверьте: 1) Запущен ли бэкенд (node server.js) 2) Правильный ли порт (3000)');
            serverStatus.textContent = '❌ Сервер не отвечает';
            showDemoData();
        }
    }
    
    async function loadStats() {
        try {
            const response = await fetch(`${API_URL}/stats`);
            const data = await response.json();
            
            if (data.success) {
                const stats = data.stats;
                statFlights.textContent = stats.total_flights || 0;
                statPassengers.textContent = stats.total_passengers || 0;
                statBookings.textContent = stats.total_bookings || 0;
                statSeats.textContent = stats.available_seats || 0;
                
                if (stats.total_flights > 0) {
                    dbStatus.textContent = '✅ База данных подключена';
                    dbStatus.style.background = '#27ae60';
                }
            }
        } catch (error) {
            console.log('Статистика недоступна');
        }
    }
    
    async function loadSeats() {
        showLoading('Загрузка мест на рейсе...');
        
        try {
            const response = await fetch(`${API_URL}/flights/${FLIGHT_ID}/seats`);
            const data = await response.json();
            
            if (data.success) {
                seatsData = data.seats;
                console.log(`✅ Загружено ${seatsData.length} мест`);
                
                // Обновляем информацию о рейсе
                await updateFlightInfo();
                
                // Рендерим места
                renderSeats(seatsData);
                
                // Показываем карту
                hideLoading();
                
                // Показываем сообщение
                showMessage('success', `Рейс ${FLIGHT_ID} загружен. Доступно мест: ${seatsData.filter(s => s.status === 'available').length}`);
            } else {
                throw new Error(data.error || 'Ошибка загрузки мест');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки мест:', error);
            showError('Не удалось загрузить места. ' + error.message);
            showDemoSeats();
        }
    }
    
    async function updateFlightInfo() {
        try {
            const response = await fetch(`${API_URL}/flights/${FLIGHT_ID}`);
            const data = await response.json();
            
            if (data.success) {
                const flight = data.flight;
                flightDetails.innerHTML = `
                    <div><strong>Рейс:</strong> ${flight.number_of_flight}</div>
                    <div><strong>Маршрут:</strong> ${flight.departure_city} → ${flight.arrival_city}</div>
                    <div><strong>Вылет:</strong> ${new Date(flight.date_time_of_departure).toLocaleString('ru-RU')}</div>
                    <div><strong>Самолет:</strong> ${flight.model_of_aircraft}</div>
                `;
                
                flightInfo.innerHTML = `
                    <i class="fas fa-plane-departure"></i> ${flight.departure_city} (${flight.departure_airport}) 
                    <i class="fas fa-long-arrow-alt-right"></i> 
                    <i class="fas fa-plane-arrival"></i> ${flight.arrival_city} (${flight.arrival_airport}) 
                    | ${new Date(flight.date_time_of_departure).toLocaleDateString('ru-RU')}
                `;
            }
        } catch (error) {
            console.log('Не удалось загрузить детали рейса');
        }
    }
    
    function renderSeats(seats) {
        const businessSeats = document.getElementById('business-seats');
        const economySeats = document.getElementById('economy-seats');
        
        businessSeats.innerHTML = '';
        economySeats.innerHTML = '';
        
        // Считаем статистику
        let businessCount = 0;
        let economyCount = 0;
        let availableCount = 0;
        
        seats.forEach(seat => {
            const seatEl = createSeatElement(seat);
            
            if (seat.class === 'business') {
                businessSeats.appendChild(seatEl);
                businessCount++;
            } else {
                economySeats.appendChild(seatEl);
                economyCount++;
            }
            
            if (seat.status === 'available') availableCount++;
        });
        
        // Обновляем заголовки
        document.querySelector('.business h3').innerHTML = 
            `<i class="fas fa-crown"></i> Бизнес класс <span class="count">(${businessCount} мест)</span>`;
        document.querySelector('.economy h3').innerHTML = 
            `<i class="fas fa-users"></i> Эконом класс <span class="count">(${economyCount} мест)</span>`;
        
        // Показываем карту
        airplaneMap.style.display = 'block';
        
        console.log(`📊 Статистика: Бизнес ${businessCount}, Эконом ${economyCount}, Свободно ${availableCount}`);
    }
    
    function createSeatElement(seat) {
        const div = document.createElement('div');
        div.className = `seat ${seat.class} ${seat.status}`;
        div.textContent = `${seat.row}${seat.letter}`;
        
        // Сохраняем данные
        div.dataset.id = seat.id;
        div.dataset.row = seat.row;
        div.dataset.letter = seat.letter;
        div.dataset.class = seat.class;
        div.dataset.price = seat.price;
        div.dataset.status = seat.status;
        
        // Подсказка
        div.title = `Место ${seat.row}${seat.letter}
Класс: ${seat.class === 'business' ? 'Бизнес' : 'Эконом'}
Цена: ${seat.price.toLocaleString('ru-RU')} ₽
Статус: ${seat.status === 'available' ? 'Свободно' : 'Занято'}`;
        
        // Обработчик клика
        if (seat.status === 'available') {
            div.addEventListener('click', () => handleSeatClick(div, seat));
        } else {
            div.style.cursor = 'not-allowed';
        }
        
        return div;
    }
    
    function handleSeatClick(seatEl, seatData) {
        // Снимаем выделение с предыдущего места
        if (selectedSeat) {
            selectedSeat.classList.remove('selected');
        }
        
        // Выделяем новое место
        seatEl.classList.add('selected');
        selectedSeat = seatEl;
        
        // Обновляем информацию
        updateSeatInfo(seatData);
        
        // Активируем кнопку бронирования
        btnBook.disabled = false;
        
        console.log(`📍 Выбрано место: ${seatData.row}${seatData.letter}`);
    }
    
    function updateSeatInfo(seat) {
        selectedSeatEl.textContent = `${seat.row}${seat.letter}`;
        seatClassEl.textContent = seat.class === 'business' ? 'Бизнес' : 'Эконом';
        seatPriceEl.textContent = `${seat.price.toLocaleString('ru-RU')} ₽`;
        seatStatusEl.textContent = seat.status === 'available' ? 'Свободно' : 'Занято';
        
        // Цвет статуса
        seatStatusEl.style.color = seat.status === 'available' ? '#27ae60' : '#e74c3c';
    }
    
    function showLoading(message) {
        loading.innerHTML = `
            <i class="fas fa-spinner fa-spin fa-3x"></i>
            <p>${message}</p>
        `;
        loading.style.display = 'block';
        airplaneMap.style.display = 'none';
    }
    
    function hideLoading() {
        loading.style.display = 'none';
        airplaneMap.style.display = 'block';
    }
    
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
        `;
        
        document.querySelector('.airplane-section').prepend(errorDiv);
        
        // Автоматическое скрытие через 10 секунд
        setTimeout(() => {
            errorDiv.remove();
        }, 10000);
    }
    
    function showMessage(type, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        document.querySelector('.info-section').prepend(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
    
    function showDemoSeats() {
        // Тестовые данные
        const demoSeats = [
            { id: 1, row: 1, letter: 'A', class: 'business', price: 25000, status: 'available' },
            { id: 2, row: 1, letter: 'C', class: 'business', price: 25000, status: 'booked' },
            { id: 3, row: 2, letter: 'A', class: 'business', price: 25000, status: 'available' },
            { id: 4, row: 2, letter: 'C', class: 'business', price: 25000, status: 'available' },
            { id: 5, row: 4, letter: 'A', class: 'economy', price: 12000, status: 'available' },
            { id: 6, row: 4, letter: 'B', class: 'economy', price: 12000, status: 'booked' },
            { id: 7, row: 4, letter: 'C', class: 'economy', price: 12000, status: 'available' },
            { id: 8, row: 5, letter: 'A', class: 'economy', price: 12000, status: 'available' },
        ];
        
        renderSeats(demoSeats);
        hideLoading();
        
        // Тестовая информация о рейсе
        flightDetails.innerHTML = `
            <div><strong>Рейс:</strong> SU 1001 (демо)</div>
            <div><strong>Маршрут:</strong> Москва → Сочи</div>
            <div><strong>Вылет:</strong> 20.05.2025, 10:00</div>
            <div><strong>Самолет:</strong> Airbus A320</div>
        `;
        
        flightInfo.innerHTML = `
            <i class="fas fa-plane-departure"></i> Москва (Шереметьево) 
            <i class="fas fa-long-arrow-alt-right"></i> 
            <i class="fas fa-plane-arrival"></i> Сочи (Адлер) 
            | 20.05.2025
        `;
        
        showMessage('info', 'Режим демонстрации: используются тестовые данные');
    }
    
    function showDemoData() {
        hideLoading();
        showDemoSeats();
        showMessage('warning', 'Сервер не доступен. Работа в демо-режиме.');
    }
    
    // ============ ОБРАБОТЧИКИ КНОПОК ============
    
    // Бронирование места
    btnBook.addEventListener('click', async function() {
        if (!selectedSeat) {
            showError('Сначала выберите место на карте!');
            return;
        }
        
        const seatId = selectedSeat.dataset.id;
        const seatPrice = selectedSeat.dataset.price;
        const seatNumber = `${selectedSeat.dataset.row}${selectedSeat.dataset.letter}`;
        
        // Показываем загрузку
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Бронирование...';
        this.disabled = true;
        
        try {
            console.log(`📤 Отправка запроса на бронирование места ${seatId}...`);
            
            const response = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    seatId: seatId,
                    passengerId: PASSENGER_ID,
                    flightId: FLIGHT_ID
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Успешное бронирование
                currentBooking = {
                    id: data.bookingId,
                    price: data.price,
                    expiresAt: new Date(data.expiresAt)
                };
                
                // Обновляем интерфейс
                selectedSeat.classList.remove('selected');
                selectedSeat.classList.add('booked');
                selectedSeat.dataset.status = 'booked';
                selectedSeat.title = selectedSeat.title.replace('Свободно', 'Забронировано');
                selectedSeat.style.cursor = 'not-allowed';
                
                // Сбрасываем выбор
                selectedSeat = null;
                updateSeatInfo({ row: '-', letter: '', class: '-', price: 0, status: '-' });
                
                // Показываем успешное сообщение
                showBookingSuccess(data, seatNumber);
                
                // Обновляем статистику
                await loadStats();
                
                // Перезагружаем места
                await loadSeats();
                
            } else {
                showError('Ошибка бронирования: ' + data.error);
            }
            
        } catch (error) {
            console.error('❌ Ошибка сети:', error);
            showError('Ошибка сети при бронировании. Проверьте подключение к серверу.');
        } finally {
            // Восстанавливаем кнопку
            this.innerHTML = originalText;
            this.disabled = selectedSeat === null;
        }
    });
    
    function showBookingSuccess(data, seatNumber) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2 style="color: #27ae60;">
                    <i class="fas fa-check-circle"></i> Бронирование успешно!
                </h2>
                
                <div style="
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                    text-align: left;
                ">
                    <p><strong>🎫 Номер брони:</strong> ${data.bookingId}</p>
                    <p><strong>💺 Место:</strong> ${seatNumber}</p>
                    <p><strong>💰 Сумма:</strong> ${data.price.toLocaleString('ru-RU')} ₽</p>
                    <p><strong>⏰ Оплатить до:</strong> ${new Date(data.expiresAt).toLocaleTimeString('ru-RU')}</p>
                </div>
                
                <p style="color: #7f8c8d; margin: 15px 0;">
                    <i class="fas fa-info-circle"></i> Бронь автоматически подтверждена в демо-режиме
                </p>
                
                <button onclick="this.closest('.modal').remove()" style="
                    padding: 12px 30px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1.1rem;
                    font-weight: bold;
                ">
                    <i class="fas fa-check"></i> Отлично!
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Автоматическое закрытие через 8 секунд
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 8000);
    }
    
    // Сброс выбора
    btnReset.addEventListener('click', function() {
        if (selectedSeat) {
            selectedSeat.classList.remove('selected');
            selectedSeat = null;
        }
        
        // Сбрасываем информацию
        selectedSeatEl.textContent = 'Не выбрано';
        seatClassEl.textContent = '-';
        seatPriceEl.textContent = '- ₽';
        seatStatusEl.textContent = '-';
        seatStatusEl.style.color = '';
        
        // Деактивируем кнопку
        btnBook.disabled = true;
        
        console.log('🔄 Выбор сброшен');
    });
    
    // Создание демо-данных
    btnDemo.addEventListener('click', async function() {
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Создание данных...';
        this.disabled = true;
        
        try {
            const response = await fetch(`${API_URL}/demo/setup`);
            const data = await response.json();
            
            if (data.success) {
                showMessage('success', 'Демо-данные успешно созданы!');
                
                // Обновляем статистику
                await loadStats();
                
                // Перезагружаем места
                await loadSeats();
                
                // Обновляем статус БД
                dbStatus.textContent = '✅ База данных подключена';
                dbStatus.style.background = '#27ae60';
                
            } else {
                showError('Ошибка создания данных: ' + data.error);
            }
        } catch (error) {
            showError('Ошибка сети при создании данных');
        } finally {
            this.innerHTML = originalText;
            this.disabled = false;
        }
    });
    
    // ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
    
    // Автоматическое обновление статистики каждые 30 секунд
    setInterval(async () => {
        await loadStats();
    }, 30000);
    
    // Проверка состояния сервера при потере фокуса
    window.addEventListener('focus', async () => {
        await loadStats();
    });
});