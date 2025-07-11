const { HEX_TYPES, RESOURCE_TYPES, ANT_TYPES } = require('./constants');
const { generateHexagon } = require('./map-generator');

// Функция для генерации HTML карты
function generateMapHTML(arenaData) {
    if (!arenaData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>DatsPulse Arena Map</title>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f0f0f0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }
                .error-container {
                    background-color: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    text-align: center;
                    max-width: 500px;
                }
                .error-message {
                    color: #d32f2f;
                    font-size: 18px;
                    margin-bottom: 20px;
                }
                .back-button {
                    background-color: #4CAF50;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    text-decoration: none;
                    display: inline-block;
                    margin-top: 20px;
                }
                .back-button:hover {
                    background-color: #45a049;
                }
            </style>
            <script>
                // Попытка обновить через 3 секунды
                setTimeout(() => {
                    location.reload();
                }, 3000);
            </script>
        </head>
        <body>
            <div class="error-container">
                <h1>⚠️ Нет данных арены</h1>
                <div class="error-message">
                    Данные арены не доступны. Возможные причины:
                    <ul style="text-align: left; margin-top: 10px;">
                        <li>Не удалось подключиться к серверу игры</li>
                        <li>Неверный токен авторизации</li>
                        <li>Раунд еще не начался</li>
                    </ul>
                </div>
                <p>Страница автоматически обновится через 3 секунды...</p>
                <a href="/" class="back-button">← Вернуться на главную</a>
            </div>
        </body>
        </html>
        `;
    }

    const hexSize = 20;
    const mapData = arenaData.map || [];
    const ants = arenaData.ants || [];
    const enemies = arenaData.enemies || [];
    const food = arenaData.food || [];
    const home = arenaData.home || [];
    const spot = arenaData.spot || {};

    // Находим границы карты
    let minQ = 0, maxQ = 0, minR = 0, maxR = 0;
    mapData.forEach(hex => {
        minQ = Math.min(minQ, hex.q);
        maxQ = Math.max(maxQ, hex.q);
        minR = Math.min(minR, hex.r);
        maxR = Math.max(maxR, hex.r);
    });

    // Добавляем отступы
    const padding = 50;
    const svgWidth = (maxQ - minQ + 2) * hexSize * 1.5 + padding * 2;
    const svgHeight = (maxR - minR + 2) * hexSize * Math.sqrt(3) + padding * 2;

    let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`;
    
    // Смещение для центрирования
    const offsetX = padding - minQ * hexSize * 1.5;
    const offsetY = padding - minR * hexSize * Math.sqrt(3);
    
    svgContent += `<g transform="translate(${offsetX}, ${offsetY})">`;

    // Рисуем гексы карты
    mapData.forEach(hex => {
        const hexType = HEX_TYPES[hex.type] || HEX_TYPES[2];
        const isHome = home.some(h => h.q === hex.q && h.r === hex.r);
        const isSpot = spot.q === hex.q && spot.r === hex.r;
        
        let color = hexType.color;
        let strokeColor = '#000';
        let strokeWidth = 1;
        
        if (isSpot) {
            strokeColor = '#FF0000';
            strokeWidth = 3;
        } else if (isHome) {
            strokeColor = '#00FF00';
            strokeWidth = 2;
        }
        
        svgContent += generateHexagon(hex.q, hex.r, hexSize, color, strokeColor, strokeWidth);
    });

    // Рисуем ресурсы
    food.forEach(resource => {
        const resourceType = RESOURCE_TYPES[resource.type] || RESOURCE_TYPES[1];
        const x = hexSize * (3/2 * resource.q);
        const y = hexSize * (Math.sqrt(3)/2 * resource.q + Math.sqrt(3) * resource.r);
        
        svgContent += `<circle cx="${x}" cy="${y}" r="${hexSize * 0.3}" fill="${resourceType.color}" stroke="#000" stroke-width="1"/>`;
        svgContent += `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="10" fill="#000">${resource.amount}</text>`;
    });

    // Рисуем своих муравьев
    ants.forEach(ant => {
        const antType = ANT_TYPES[ant.type] || ANT_TYPES[0];
        const x = hexSize * (3/2 * ant.q);
        const y = hexSize * (Math.sqrt(3)/2 * ant.q + Math.sqrt(3) * ant.r);
        
        svgContent += `<circle cx="${x}" cy="${y}" r="${hexSize * 0.4}" fill="${antType.color}" stroke="#000" stroke-width="2"/>`;
        svgContent += `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="8" fill="#FFF">${ant.health}</text>`;
    });

    // Рисуем вражеских муравьев
    enemies.forEach(enemy => {
        const antType = ANT_TYPES[enemy.type] || ANT_TYPES[0];
        const x = hexSize * (3/2 * enemy.q);
        const y = hexSize * (Math.sqrt(3)/2 * enemy.q + Math.sqrt(3) * enemy.r);
        
        svgContent += `<circle cx="${x}" cy="${y}" r="${hexSize * 0.4}" fill="${antType.color}" stroke="#FF0000" stroke-width="3"/>`;
        svgContent += `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="8" fill="#FFF">${enemy.health}</text>`;
    });

    svgContent += '</g></svg>';

    // Создаем полную HTML страницу
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>DatsPulse Arena Map</title>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f0f0f0;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background-color: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
            }
            .info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
                padding: 10px;
                background-color: #e8f4f8;
                border-radius: 5px;
            }
            .map-container {
                text-align: center;
                overflow: auto;
            }
            .legend {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 20px;
                justify-content: center;
            }
            .legend-item {
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 5px 10px;
                background-color: #f8f8f8;
                border-radius: 5px;
            }
            .legend-color {
                width: 20px;
                height: 20px;
                border: 1px solid #000;
            }
            .auto-refresh {
                position: fixed;
                top: 10px;
                right: 10px;
                background-color: #4CAF50;
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-size: 12px;
            }
        </style>
        <script>
            // Автообновление каждые 2 секунды
            setTimeout(() => {
                location.reload();
            }, 2000);
        </script>
    </head>
    <body>
        <div class="auto-refresh">🔄 Автообновление</div>
        <div class="container">
            <div class="header">
                <h1>DatsPulse Arena Map</h1>
                <p>Карта арены с визуализацией в реальном времени</p>
            </div>
            
            <div class="info">
                <div><strong>Ход:</strong> ${arenaData.turnNo}</div>
                <div><strong>Счет:</strong> ${arenaData.score}</div>
                <div><strong>До следующего хода:</strong> ${arenaData.nextTurnIn.toFixed(1)}с</div>
                <div><strong>Муравьев:</strong> ${ants.length}</div>
                <div><strong>Врагов видно:</strong> ${enemies.length}</div>
                <div><strong>Ресурсов:</strong> ${food.length}</div>
            </div>
            
            <div class="map-container">
                ${svgContent}
            </div>
            
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #90EE90;"></div>
                    <span>Пустой гекс</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #8B4513;"></div>
                    <span>Грязь/Муравейник</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #FFFF00;"></div>
                    <span>Кислота</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #808080;"></div>
                    <span>Камни</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #FF0000; border-radius: 50%;"></div>
                    <span>Яблоко</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #DEB887; border-radius: 50%;"></div>
                    <span>Хлеб</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #FFD700; border-radius: 50%;"></div>
                    <span>Нектар</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #8B4513; border-radius: 50%;"></div>
                    <span>Рабочий</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #FF0000; border-radius: 50%;"></div>
                    <span>Боец</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #0000FF; border-radius: 50%;"></div>
                    <span>Разведчик</span>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

module.exports = {
    generateMapHTML
};
