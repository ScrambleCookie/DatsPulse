// Vue компонент для карты арены
const MapComponent = {
    props: ['arenaData'],
    data() {
        return {
            hexSize: 20,
            mapTransform: { x: 0, y: 0 },
            baseCoords: { x: 0, y: 0 },
            isDragging: false,
            dragStart: { x: 0, y: 0 }
        };
    },
    
    computed: {
        mapSvg() {
            return this.generateMapSvg();
        }
    },
    
    methods: {
        generateMapSvg() {
            if (!this.arenaData) return '';
            
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
                
                const offsetX = 50 - minQ * this.hexSize * 1.5;
                const offsetY = 50 - minR * this.hexSize * Math.sqrt(3);
                
                this.baseCoords.x = offsetX + this.hexSize * (3/2 * baseQ);
                this.baseCoords.y = offsetY + this.hexSize * (Math.sqrt(3)/2 * baseQ + Math.sqrt(3) * baseR);
            }
            
            // Центрируем карту на базе при первой загрузке
            if (this.mapTransform.x === 0 && this.mapTransform.y === 0) {
                this.mapTransform.x = 300 - this.baseCoords.x;
                this.mapTransform.y = 300 - this.baseCoords.y;
            }
            
            const padding = 50;
            const svgWidth = (maxQ - minQ + 2) * this.hexSize * 1.5 + padding * 2;
            const svgHeight = (maxR - minR + 2) * this.hexSize * Math.sqrt(3) + padding * 2;
            
            let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="transform: translate(${this.mapTransform.x}px, ${this.mapTransform.y}px);">`;
            
            const offsetX = padding - minQ * this.hexSize * 1.5;
            const offsetY = padding - minR * this.hexSize * Math.sqrt(3);
            
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
                
                svgContent += this.generateHexagon(hex.q, hex.r, this.hexSize, color, strokeColor, strokeWidth);
            });
            
            // Рисуем ресурсы
            food.forEach(resource => {
                const color = this.getResourceColor(resource.type);
                const x = this.hexSize * (3/2 * resource.q);
                const y = this.hexSize * (Math.sqrt(3)/2 * resource.q + Math.sqrt(3) * resource.r);
                
                svgContent += `<circle cx="${x}" cy="${y}" r="${this.hexSize * 0.3}" fill="${color}" stroke="#000" stroke-width="1"/>`;
                svgContent += `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="10" fill="#000">${resource.amount}</text>`;
            });
            
            // Рисуем своих муравьев
            ants.forEach(ant => {
                const color = this.getAntColor(ant.type);
                const x = this.hexSize * (3/2 * ant.q);
                const y = this.hexSize * (Math.sqrt(3)/2 * ant.q + Math.sqrt(3) * ant.r);
                
                svgContent += `<circle cx="${x}" cy="${y}" r="${this.hexSize * 0.4}" fill="${color}" stroke="#000" stroke-width="2"/>`;
                svgContent += `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="8" fill="#FFF">${ant.health}</text>`;
            });
            
            // Рисуем вражеских муравьев
            enemies.forEach(enemy => {
                const color = this.getAntColor(enemy.type);
                const x = this.hexSize * (3/2 * enemy.q);
                const y = this.hexSize * (Math.sqrt(3)/2 * enemy.q + Math.sqrt(3) * enemy.r);
                
                svgContent += `<circle cx="${x}" cy="${y}" r="${this.hexSize * 0.4}" fill="${color}" stroke="#FF0000" stroke-width="3"/>`;
                svgContent += `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="8" fill="#FFF">${enemy.health}</text>`;
            });
            
            svgContent += '</g></svg>';
            return svgContent;
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
        },
        
        stopDrag() {
            this.isDragging = false;
        }
    },
    
    template: `
        <div class="map-viewport">
            <div 
                v-html="mapSvg" 
                class="map-svg"
                @mousedown="startDrag"
                @mousemove="drag"
                @mouseup="stopDrag"
                @mouseleave="stopDrag"
            ></div>
        </div>
    `
};
