function generateHomeHTML(DEMO_MODE, port) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>DatsPulse Server</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .container { max-width: 600px; margin: 0 auto; }
                h1 { color: #333; }
                .links { margin: 20px 0; }
                .links a { 
                    display: block; 
                    margin: 10px 0; 
                    padding: 10px 15px; 
                    background-color: #4CAF50; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px; 
                }
                .links a:hover { background-color: #45a049; }
                .status { 
                    background-color: #f0f0f0; 
                    padding: 10px; 
                    border-radius: 5px; 
                    margin: 20px 0; 
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🐜 DatsPulse Server</h1>
                <p>Сервер для визуализации арены DatsPulse в реальном времени</p>
                
                <div class="status">
                    <strong>Статус:</strong> Работает<br>
                    <strong>Режим:</strong> ${DEMO_MODE ? 'Демонстрация' : 'Реальные данные'}<br>
                    <strong>Порт:</strong> ${port}
                </div>
                
                <div class="links">
                    <a href="/map">🗺️ Карта арены (HTML)</a>
                    <a href="/api/arena-data">📊 Данные арены (JSON)</a>
                    <a href="/toggle-demo">🔄 Переключить демо-режим</a>
                </div>
                
                <h3>Инструкция по использованию:</h3>
                <ol>
                    <li>Для работы с реальными данными, замените <code>YOUR_TOKEN_HERE</code> на ваш токен в коде</li>
                    <li>Откройте <a href="/map">/map</a> для просмотра карты</li>
                    <li>Карта автоматически обновляется каждые 2 секунды</li>
                    <li>Используйте <a href="/toggle-demo">/toggle-demo</a> для переключения между демо и реальными данными</li>
                </ol>
            </div>
        </body>
        </html>
    `;
}

module.exports = {
    generateHomeHTML
};
