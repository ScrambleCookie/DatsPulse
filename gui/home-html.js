function generateHomeHTML(isRegistered, port) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>DatsPulse Server</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 40px; 
                    background-color: #f5f5f5;
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 { 
                    color: #333; 
                    text-align: center;
                }
                .status { 
                    background-color: #e8f4f8; 
                    padding: 15px; 
                    border-radius: 5px; 
                    margin: 20px 0;
                    border-left: 4px solid #4CAF50;
                }
                .register-section {
                    text-align: center;
                    margin: 30px 0;
                }
                .register-button {
                    background-color: #4CAF50;
                    color: white;
                    padding: 15px 30px;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                    margin: 10px;
                }
                .register-button:hover {
                    background-color: #45a049;
                }
                .register-button:disabled {
                    background-color: #cccccc;
                    cursor: not-allowed;
                }
                .map-button {
                    background-color: #2196F3;
                    color: white;
                    padding: 15px 30px;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                    margin: 10px;
                }
                .map-button:hover {
                    background-color: #1976D2;
                }
                .instructions {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .warning {
                    background-color: #fff3cd;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-left: 4px solid #ffc107;
                }
            </style>
            <script>
                function registerForRound() {
                    const token = prompt('Введите ваш токен для регистрации на раунд:');
                    if (!token) {
                        alert('Токен не может быть пустым');
                        return;
                    }
                    
                    const button = document.getElementById('registerBtn');
                    button.disabled = true;
                    button.textContent = 'Регистрация...';
                    
                    fetch('/api/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ token: token })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Регистрация успешна! Переходим к карте...');
                            window.location.href = '/map';
                        } else {
                            alert('Ошибка регистрации: ' + data.error);
                            button.disabled = false;
                            button.textContent = '🎮 Зарегистрироваться на раунд';
                        }
                    })
                    .catch(error => {
                        console.error('Registration error:', error);
                        alert('Ошибка подключения к серверу');
                        button.disabled = false;
                        button.textContent = '🎮 Зарегистрироваться на раунд';
                    });
                }
            </script>
        </head>
        <body>
            <div class="container">
                <h1>🐜 DatsPulse Arena</h1>
                <p style="text-align: center;">Сервер для визуализации арены DatsPulse в реальном времени</p>
                
                <div class="status">
                    <strong>Статус сервера:</strong> Работает<br>
                    <strong>Порт:</strong> ${port}<br>
                    <strong>Регистрация:</strong> ${isRegistered ? '✅ Зарегистрирован' : '❌ Не зарегистрирован'}
                </div>
                
                ${!isRegistered ? `
                <div class="register-section">
                    <h3>Для начала игры необходимо зарегистрироваться</h3>
                    <button id="registerBtn" class="register-button" onclick="registerForRound()">
                        🎮 Зарегистрироваться на раунд
                    </button>
                </div>
                
                <div class="instructions">
                    <h3>Как получить токен:</h3>
                    <ol>
                        <li>Перейдите на страницу регистрации команды</li>
                        <li>Получите ваш уникальный токен</li>
                        <li>Введите его в поле при регистрации</li>
                        <li>После успешной регистрации вы будете перенаправлены на карту</li>
                    </ol>
                </div>
                
                <div class="warning">
                    <strong>Важно:</strong> Токен необходим для каждого раунда. Убедитесь, что используете правильный токен для текущего раунда.
                </div>
                ` : `
                <div class="register-section">
                    <h3>✅ Вы зарегистрированы на раунд!</h3>
                    <a href="/map" class="map-button">🗺️ Открыть карту арены</a>
                </div>
                `}
            </div>
        </body>
        </html>
    `;
}

module.exports = {
    generateHomeHTML
};
