const { createApp } = Vue;

// Константы игры
const HEX_TYPES = {
    1: { name: 'муравейник', color: '#8B4513', cost: 1 },
    2: { name: 'пустой', color: '#90EE90', cost: 1 },
    3: { name: 'грязь', color: '#8B4513', cost: 2 },
    4: { name: 'кислота', color: '#FFFF00', cost: 1 },
    5: { name: 'камни', color: '#808080', cost: Infinity }
};

const RESOURCE_TYPES = {
    1: { name: 'яблоко', color: '#FF0000', calories: 10 },
    2: { name: 'хлеб', color: '#DEB887', calories: 20 },
    3: { name: 'нектар', color: '#FFD700', calories: 60 }
};

const ANT_TYPES = {
    0: { name: 'Рабочий', color: '#8B4513', hp: 130, attack: 30, cargo: 8, vision: 1, speed: 5 },
    1: { name: 'Боец', color: '#FF0000', hp: 180, attack: 70, cargo: 2, vision: 1, speed: 4 },
    2: { name: 'Разведчик', color: '#0000FF', hp: 80, attack: 20, cargo: 2, vision: 4, speed: 7 }
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
            if (!this.arenaData) return;
            
            const hexSize = 20;
            const mapData = this.arenaData.map || [];
            const ants = this.arenaData.ants || [];
            const enemies = this.arenaData.enemies || [];
            const food = this.arenaData.food || [];
            const home = this.arenaData.home || [];
            const spot = this.arenaData.spot || {};
            
            // Находим границы карты
            let minQ = 0, maxQ = 0, minR = 0, maxR = 0;
            mapData.forEach(hex => {
                minQ = Math.min(minQ, hex.q);
                maxQ = Math.max(maxQ, hex.q);
                minR = Math.min(minR, hex.r);
                maxR = Math.max(maxR, hex.r);
            });
            
            // Находим координаты базы
            if (home.length > 0) {
                const baseQ = home.reduce((sum, h) => sum + h.q, 0) / home.length;
                const baseR = home.reduce((sum, h) => sum + h.r, 0) / home.length;
                
                // Правильное вычисление координат базы с учетом offset
                const offsetX = 50 - minQ * hexSize * 1.5;
                const offsetY = 50 - minR * hexSize * Math.sqrt(3);
                
                this.baseCoords.x = offsetX + hexSize * (3/2 * baseQ);
                this.baseCoords.y = offsetY + hexSize * (Math.sqrt(3)/2 * baseQ + Math.sqrt(3) * baseR);
            }
            
            const padding = 50;
            const svgWidth = (maxQ - minQ + 2) * hexSize * 1.5 + padding * 2;
            const svgHeight = (maxR - minR + 2) * hexSize * Math.sqrt(3) + padding * 2;
            
            // Центрируем карту на базе при первой загрузке
            if (this.mapTransform.x === 0 && this.mapTransform.y === 0) {
                this.mapTransform.x = 300 - this.baseCoords.x; // 300 - половина ширины viewport
                this.mapTransform.y = 300 - this.baseCoords.y; // 300 - половина высоты viewport
            }
            
            let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="transform: translate(${this.mapTransform.x}px, ${this.mapTransform.y}px);">`;
            
            const offsetX = padding - minQ * hexSize * 1.5;
            const offsetY = padding - minR * hexSize * Math.sqrt(3);
            
            svgContent += `<g transform="translate(${offsetX}, ${offsetY})">`;
            
            // Рисуем гексы карты
            mapData.forEach(hex => {
                const isHome = home.some(h => h.q === hex.q && h.r === hex.r);
                const isSpot = spot.q === hex.q && spot.r === hex.r;
                
                let color = this.getHexColor(hex.type);
                let strokeColor = '#000';
                let strokeWidth = 1;
                
                if (isSpot) {
                    strokeColor = '#FF0000';
                    strokeWidth = 3;
                } else if (isHome) {
                    strokeColor = '#00FF00';
                    strokeWidth = 2;
                }
                
                svgContent += this.generateHexagon(hex.q, hex.r, hexSize, color, strokeColor, strokeWidth);
            });
            
            // Рисуем ресурсы
            food.forEach(resource => {
                const color = this.getResourceColor(resource.type);
                const x = hexSize * (3/2 * resource.q);
                const y = hexSize * (Math.sqrt(3)/2 * resource.q + Math.sqrt(3) * resource.r);
                
                svgContent += `<circle cx="${x}" cy="${y}" r="${hexSize * 0.3}" fill="${color}" stroke="#000" stroke-width="1"/>`;
                svgContent += `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="10" fill="#000">${resource.amount}</text>`;
            });
            
            // Рисуем своих муравьев
            ants.forEach(ant => {
                const color = this.getAntColor(ant.type);
                const x = hexSize * (3/2 * ant.q);
                const y = hexSize * (Math.sqrt(3)/2 * ant.q + Math.sqrt(3) * ant.r);
                
                svgContent += `<circle cx="${x}" cy="${y}" r="${hexSize * 0.4}" fill="${color}" stroke="#000" stroke-width="2"/>`;
                svgContent += `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="8" fill="#FFF">${ant.health}</text>`;
            });
            
            // Рисуем вражеских муравьев
            enemies.forEach(enemy => {
                const color = this.getAntColor(enemy.type);
                const x = hexSize * (3/2 * enemy.q);
                const y = hexSize * (Math.sqrt(3)/2 * enemy.q + Math.sqrt(3) * enemy.r);
                
                svgContent += `<circle cx="${x}" cy="${y}" r="${hexSize * 0.4}" fill="${color}" stroke="#FF0000" stroke-width="3"/>`;
                svgContent += `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="8" fill="#FFF">${enemy.health}</text>`;
            });
            
            svgContent += '</g></svg>';
            this.mapSvg = svgContent;
        },
        
        generateHexagon(q, r, size, fillColor, strokeColor, strokeWidth) {
            const x = size * (3/2 * q);
            const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
            
            const points = [];
            for (let i = 0; i < 6; i++) {
                const angle = Math.PI / 3 * i;
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
            this.mapTransform.x = 300 - this.baseCoords.x;
            this.mapTransform.y = 300 - this.baseCoords.y;
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
