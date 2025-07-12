const { createApp } = Vue;

// Константы игры с уникальными цветами
const HEX_TYPES = {
    1: { name: 'муравейник', color: '#8B4513', cost: 1 },
    2: { name: 'пустой', color: '#90EE90', cost: 1 },
    3: { name: 'грязь', color: '#654321', cost: 2 },
    4: { name: 'кислота', color: '#FFFF00', cost: 1 },
    5: { name: 'камни', color: '#808080', cost: Infinity }
};

const RESOURCE_TYPES = {
    1: { name: 'яблоко', color: '#FF8C00', calories: 10 },
    2: { name: 'хлеб', color: '#DEB887', calories: 20 },
    3: { name: 'нектар', color: '#FFD700', calories: 60 }
};

const ANT_TYPES = {
    0: { name: 'Рабочий', color: '#8B4513', hp: 130, attack: 30, cargo: 8, vision: 1, speed: 5 },
    1: { name: 'Боец', color: '#DC143C', hp: 180, attack: 70, cargo: 2, vision: 1, speed: 4 },
    2: { name: 'Разведчик', color: '#0000FF', hp: 80, attack: 20, cargo: 2, vision: 4, speed: 7 }
};

// Дополнительные цвета для карты
const MAP_COLORS = {
    HOME_BORDER: '#00FF00',
    SPOT_BORDER: '#FF0000',
    CACHED_HEX: '#555555',
    ENEMY_BORDER: '#FF0000',
    ALLY_BORDER: '#000000'
};

createApp({
    data() {
        return {
            serverStatus: {
                isOnline: true
            },
            gameStatus: {
                isRegistered: false
            },
            arenaData: null,
            loading: false,
            autoUpdate: true,
            errorMessage: '',
            successMessage: '',
            
            // Для карты
            mapRef: null,
            mapSvg: '',
            mapTransform: { x: 0, y: 0 },
            baseCoords: { x: 0, y: 0 },
            isDragging: false,
            dragStart: { x: 0, y: 0 },
            mapZoom: 1,
            
            updateInterval: null
        };
    },
    
    mounted() {
        this.checkStatus();
        this.startAutoUpdate();
    },
    
    beforeUnmount() {
        this.stopAutoUpdate();
    },
    
    computed: {
        // Статистика по муравьям
        antStats() {
            if (!this.arenaData || !this.arenaData.ants) return {};
            
            const stats = {
                total: this.arenaData.ants.length,
                workers: this.arenaData.ants.filter(ant => ant.type === 0).length,
                warriors: this.arenaData.ants.filter(ant => ant.type === 1).length,
                scouts: this.arenaData.ants.filter(ant => ant.type === 2).length,
                totalHealth: this.arenaData.ants.reduce((sum, ant) => sum + ant.health, 0),
                averageHealth: this.arenaData.ants.length ? 
                    (this.arenaData.ants.reduce((sum, ant) => sum + ant.health, 0) / this.arenaData.ants.length).toFixed(1) : 0
            };
            
            return stats;
        },
        
        // Статистика по ресурсам
        resourceStats() {
            if (!this.arenaData || !this.arenaData.food) return {};
            
            const stats = {
                total: this.arenaData.food.length,
                apples: this.arenaData.food.filter(food => food.type === 1).length,
                bread: this.arenaData.food.filter(food => food.type === 2).length,
                nectar: this.arenaData.food.filter(food => food.type === 3).length,
                totalAmount: this.arenaData.food.reduce((sum, food) => sum + food.amount, 0)
            };
            
            return stats;
        },
        
        // Статистика по врагам
        enemyStats() {
            if (!this.arenaData || !this.arenaData.enemies) return {};
            
            const stats = {
                total: this.arenaData.enemies.length,
                workers: this.arenaData.enemies.filter(enemy => enemy.type === 0).length,
                warriors: this.arenaData.enemies.filter(enemy => enemy.type === 1).length,
                scouts: this.arenaData.enemies.filter(enemy => enemy.type === 2).length,
                totalHealth: this.arenaData.enemies.reduce((sum, enemy) => sum + enemy.health, 0)
            };
            
            return stats;
        },
        
        // Статистика по карте
        mapStats() {
            if (!this.arenaData || !this.arenaData.map) return {};
            
            const stats = {
                totalHexes: this.arenaData.map.length,
                empty: this.arenaData.map.filter(hex => hex.type === 2).length,
                dirt: this.arenaData.map.filter(hex => hex.type === 3).length,
                acid: this.arenaData.map.filter(hex => hex.type === 4).length,
                stones: this.arenaData.map.filter(hex => hex.type === 5).length,
                anthill: this.arenaData.map.filter(hex => hex.type === 1).length,
                cached: this.arenaData.map.filter(hex => hex.isFromCache).length
            };
            
            return stats;
        }
    },
    
    methods: {
        async checkStatus() {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                this.gameStatus.isRegistered = status.isRegistered;
                this.serverStatus.isOnline = true;
                
                if (status.isRegistered) {
                    await this.fetchArenaData();
                }
            } catch (error) {
                console.error('Error checking status:', error);
                this.serverStatus.isOnline = false;
            }
        },
        
        async register() {
            this.loading = true;
            this.errorMessage = '';
            this.successMessage = '';
            
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.successMessage = 'Регистрация успешна!';
                    this.gameStatus.isRegistered = true;
                    await this.fetchArenaData();
                } else {
                    this.errorMessage = this.getErrorMessage(result.error);
                }
            } catch (error) {
                console.error('Registration error:', error);
                this.errorMessage = 'Ошибка подключения к серверу';
            } finally {
                this.loading = false;
            }
        },
        
        async fetchArenaData() {
            if (!this.gameStatus.isRegistered) return;
            
            try {
                const response = await fetch('/api/arena');
                if (response.ok) {
                    const data = await response.json();
                    this.arenaData = data;
                    this.updateMapSvg();
                } else {
                    console.error('Failed to fetch arena data');
                }
            } catch (error) {
                console.error('Error fetching arena data:', error);
            }
        },
        
        updateMapSvg() {
            console.log('Updating map SVG...');
            
            if (!this.arenaData) {
                console.log('No arena data available');
                this.mapSvg = `
                    <svg width="100%" height="100%" viewBox="0 0 600 400">
                        <rect width="600" height="400" fill="#f0f0f0" stroke="#ccc"/>
                        <text x="300" y="200" text-anchor="middle" font-size="18" fill="#666">
                            Загрузка данных арены...
                        </text>
                    </svg>
                `;
                return;
            }
            
            const hexSize = 25;
            const mapData = this.arenaData.map || [];
            const ants = this.arenaData.ants || [];
            const enemies = this.arenaData.enemies || [];
            const food = this.arenaData.food || [];
            const home = this.arenaData.home || [];
            const spot = this.arenaData.spot || {};
            
            console.log('Map data length:', mapData.length);
            console.log('Ants:', ants.length);
            console.log('Enemies:', enemies.length);
            console.log('Food:', food.length);
            
            if (mapData.length === 0) {
                console.log('Map data is empty, showing test hexagon');
                this.mapSvg = `
                    <svg width="100%" height="100%" viewBox="0 0 600 400">
                        <rect width="600" height="400" fill="#f8f8f8" stroke="#ddd"/>
                        <polygon points="280,180 320,160 360,180 360,220 320,240 280,220" 
                                fill="#90EE90" stroke="#000" stroke-width="2"/>
                        <text x="300" y="280" text-anchor="middle" font-size="16" fill="#666">
                            Нет данных карты
                        </text>
                    </svg>
                `;
                return;
            }
            
            // Находим границы карты
            let minQ = Math.min(...mapData.map(h => h.q));
            let maxQ = Math.max(...mapData.map(h => h.q));
            let minR = Math.min(...mapData.map(h => h.r));
            let maxR = Math.max(...mapData.map(h => h.r));
            
            console.log('Map bounds:', { minQ, maxQ, minR, maxR });
            
            // Вычисляем размеры карты в пикселях
            const mapWidth = (maxQ - minQ + 3) * hexSize * 1.5;
            const mapHeight = (maxR - minR + 3) * hexSize * Math.sqrt(3);
            
            // Центрируем карту относительно минимальных координат
            const centerX = mapWidth / 2;
            const centerY = mapHeight / 2;
            
            let svgContent = `<svg width="100%" height="100%" viewBox="0 0 ${mapWidth} ${mapHeight}">`;
            
            // Рисуем фон
            svgContent += `<rect width="${mapWidth}" height="${mapHeight}" fill="#f8f8f8"/>`;
            
            // Рисуем гексы карты
            mapData.forEach(hex => {
                const x = centerX + (hex.q - (minQ + maxQ) / 2) * hexSize * 1.5;
                const y = centerY + (hex.r - (minR + maxR) / 2) * hexSize * Math.sqrt(3) + 
                         (hex.q - (minQ + maxQ) / 2) * hexSize * Math.sqrt(3) / 2;
                
                const isHome = home.some(h => h.q === hex.q && h.r === hex.r);
                const isSpot = spot.q === hex.q && spot.r === hex.r;
                const isFromCache = hex.isFromCache || false;
                
                let color = this.getHexColor(hex.type);
                if (isFromCache) {
                    color = MAP_COLORS.CACHED_HEX;
                }
                
                let strokeColor = '#000';
                let strokeWidth = 1;
                
                if (isSpot) {
                    strokeColor = MAP_COLORS.SPOT_BORDER;
                    strokeWidth = 3;
                } else if (isHome) {
                    strokeColor = MAP_COLORS.HOME_BORDER;
                    strokeWidth = 2;
                }
                
                // Генерируем гексагон вручную для надежности
                const points = [];
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const px = x + hexSize * Math.cos(angle);
                    const py = y + hexSize * Math.sin(angle);
                    points.push(`${px},${py}`);
                }
                
                svgContent += `<polygon points="${points.join(' ')}" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
            });
            
            // Рисуем ресурсы
            food.forEach(resource => {
                const x = centerX + (resource.q - (minQ + maxQ) / 2) * hexSize * 1.5;
                const y = centerY + (resource.r - (minR + maxR) / 2) * hexSize * Math.sqrt(3) + 
                         (resource.q - (minQ + maxQ) / 2) * hexSize * Math.sqrt(3) / 2;
                
                const color = this.getResourceColor(resource.type);
                svgContent += `<circle cx="${x}" cy="${y}" r="${hexSize * 0.3}" fill="${color}" stroke="#000" stroke-width="1"/>`;
                svgContent += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" fill="#000">${resource.amount}</text>`;
            });
            
            // Рисуем своих муравьев
            ants.forEach(ant => {
                const x = centerX + (ant.q - (minQ + maxQ) / 2) * hexSize * 1.5;
                const y = centerY + (ant.r - (minR + maxR) / 2) * hexSize * Math.sqrt(3) + 
                         (ant.q - (minQ + maxQ) / 2) * hexSize * Math.sqrt(3) / 2;
                
                const color = this.getAntColor(ant.type);
                svgContent += `<circle cx="${x}" cy="${y}" r="${hexSize * 0.4}" fill="${color}" stroke="${MAP_COLORS.ALLY_BORDER}" stroke-width="2"/>`;
                svgContent += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="8" fill="#FFF">${ant.health}</text>`;
            });
            
            // Рисуем вражеских муравьев
            enemies.forEach(enemy => {
                const x = centerX + (enemy.q - (minQ + maxQ) / 2) * hexSize * 1.5;
                const y = centerY + (enemy.r - (minR + maxR) / 2) * hexSize * Math.sqrt(3) + 
                         (enemy.q - (minQ + maxQ) / 2) * hexSize * Math.sqrt(3) / 2;
                
                const color = this.getAntColor(enemy.type);
                svgContent += `<circle cx="${x}" cy="${y}" r="${hexSize * 0.4}" fill="${color}" stroke="${MAP_COLORS.ENEMY_BORDER}" stroke-width="3"/>`;
                svgContent += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="8" fill="#FFF">${enemy.health}</text>`;
            });
            
            svgContent += '</svg>';
            this.mapSvg = svgContent;
            
            console.log('SVG generated successfully');
        },
        
        generateHexagon(q, r, size, fillColor, strokeColor, strokeWidth) {
            const x = size * (3/2 * q);
            const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
            
            const points = [];
            for (let i = 0; i < 6; i++) {
                const angle = Math.PI / 3 * i - Math.PI / 2; // Поворачиваем на 90 градусов
                const px = x + size * Math.cos(angle);
                const py = y + size * Math.sin(angle);
                points.push(`${px},${py}`);
            }
            
            return `<polygon points="${points.join(' ')}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
        },
        
        getHexColor(type) {
            return HEX_TYPES[type]?.color || '#90EE90';
        },
        
        getResourceColor(type) {
            return RESOURCE_TYPES[type]?.color || '#FF0000';
        },
        
        getAntColor(type) {
            return ANT_TYPES[type]?.color || '#8B4513';
        },
        
        centerOnBase() {
            // Сбрасываем трансформацию для центрирования на базе
            this.mapTransform.x = 0;
            this.mapTransform.y = 0;
            this.updateMapSvg();
        },
        
        startDrag(event) {
            this.isDragging = true;
            this.dragStart.x = event.clientX - this.mapTransform.x;
            this.dragStart.y = event.clientY - this.mapTransform.y;
        },
        
        drag(event) {
            if (!this.isDragging) return;
            
            this.mapTransform.x = event.clientX - this.dragStart.x;
            this.mapTransform.y = event.clientY - this.dragStart.y;
            this.updateMapSvg();
        },
        
        stopDrag() {
            this.isDragging = false;
        },
        
        startAutoUpdate() {
            this.updateInterval = setInterval(() => {
                if (this.autoUpdate && this.gameStatus.isRegistered) {
                    this.fetchArenaData();
                }
            }, 1000);
        },
        
        stopAutoUpdate() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        },
        
        toggleAutoUpdate() {
            this.autoUpdate = !this.autoUpdate;
        },
        
        getErrorMessage(error) {
            if (error.includes('no active game')) {
                return 'Нет активной игры. Проверьте расписание раундов или попробуйте позже.';
            }
            return `Ошибка: ${error}`;
        },
        
        clearMessages() {
            setTimeout(() => {
                this.errorMessage = '';
                this.successMessage = '';
            }, 5000);
        },
        
        // Методы для перетаскивания карты
        startDrag(event) {
            this.isDragging = true;
            this.dragStart = {
                x: event.clientX,
                y: event.clientY
            };
            
            // Добавляем класс для стилизации
            const mapElement = event.target.closest('.map-svg');
            if (mapElement) {
                mapElement.classList.add('dragging');
            }
            
            document.addEventListener('mousemove', this.onDrag);
            document.addEventListener('mouseup', this.endDrag);
            event.preventDefault();
        },
        
        onDrag(event) {
            if (!this.isDragging) return;
            
            const deltaX = event.clientX - this.dragStart.x;
            const deltaY = event.clientY - this.dragStart.y;
            
            this.mapTransform.x = this.baseCoords.x + deltaX;
            this.mapTransform.y = this.baseCoords.y + deltaY;
            
            this.updateMapTransform();
            event.preventDefault();
        },
        
        endDrag(event) {
            if (!this.isDragging) return;
            
            this.isDragging = false;
            this.baseCoords.x = this.mapTransform.x;
            this.baseCoords.y = this.mapTransform.y;
            
            // Убираем класс стилизации
            const mapElement = document.querySelector('.map-svg');
            if (mapElement) {
                mapElement.classList.remove('dragging');
            }
            
            document.removeEventListener('mousemove', this.onDrag);
            document.removeEventListener('mouseup', this.endDrag);
        },
        
        updateMapTransform() {
            const mapElement = document.querySelector('.map-svg svg');
            if (mapElement) {
                mapElement.style.transform = `translate(${this.mapTransform.x}px, ${this.mapTransform.y}px) scale(${this.mapZoom})`;
            }
        },
        
        handleWheel(event) {
            event.preventDefault();
            
            const zoomIntensity = 0.1;
            const wheel = event.deltaY < 0 ? 1 : -1;
            const zoom = Math.exp(wheel * zoomIntensity);
            
            this.mapZoom = Math.min(Math.max(0.5, this.mapZoom * zoom), 3);
            this.updateMapTransform();
        },
        
        resetMapPosition() {
            this.mapTransform = { x: 0, y: 0 };
            this.baseCoords = { x: 0, y: 0 };
            this.updateMapTransform();
        },
        
        resetMapZoom() {
            this.mapZoom = 1;
            this.updateMapTransform();
        },
        
        darkenColor(color, factor) {
            // Функция для затемнения цвета
            if (color.startsWith('#')) {
                const num = parseInt(color.replace('#', ''), 16);
                const r = Math.floor((num >> 16) * factor);
                const g = Math.floor(((num >> 8) & 0x00FF) * factor);
                const b = Math.floor((num & 0x0000FF) * factor);
                return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
            }
            return color;
        }
    },
    
    watch: {
        errorMessage(newVal) {
            if (newVal) this.clearMessages();
        },
        successMessage(newVal) {
            if (newVal) this.clearMessages();
        }
    }
}).mount('#app');
