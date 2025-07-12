require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 8080;

app.use(cors({origin: '*'}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static('public')); // Добавляем статические файлы

// Кэш для данных арены
let arenaData = null;
let lastUpdateTime = 0;
let isRegistered = false;
let currentToken = process.env.TOKEN; // Берем токен из .env файла

// Конфигурация для API
const API_CONFIG = {
    baseURL: process.env.API_BASE_URL || 'https://games-test.datsteam.dev', // или 'https://games.datsteam.dev' для финальных раундов
    headers: {
        'Content-Type': 'application/json'
    }
};

// Функция для получения данных арены
async function fetchArenaData() {
    try {
        if (!isRegistered || !currentToken) {
            console.log('Not registered or no token available');
            return null;
        }

        const response = await axios.get(`${API_CONFIG.baseURL}/api/arena`, {
            headers: {
                ...API_CONFIG.headers,
                'X-Auth-Token': currentToken
            }
        });
        arenaData = response.data;
        lastUpdateTime = Date.now();
        console.log(`Arena data updated. Turn: ${arenaData.turnNo}, Next turn in: ${arenaData.nextTurnIn}s`);
        return arenaData;
    } catch (error) {
        console.error('Error fetching arena data:', error.message);
        return null;
    }
}

// Функция для регистрации на раунд
async function registerForRound() {
    try {
        if (!currentToken) {
            throw new Error('Токен не найден в .env файле');
        }

        const response = await axios.post(`${API_CONFIG.baseURL}/api/register?token=${currentToken}`, {}, {
            headers: {
                ...API_CONFIG.headers,
                'X-Auth-Token': currentToken
            }
        });
        
        isRegistered = true;
        console.log('Successfully registered for round');
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Registration failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return { success: false, error: error.message };
    }
}

// Запуск периодического обновления данных
setInterval(fetchArenaData, 1000);

// Инициализация первого запроса
fetchArenaData();

/* API эндпоинты */

/* Эндпоинт для получения статуса сервера */
app.get('/api/status', async (req, res) => {
    try {
        res.json({
            isRegistered: isRegistered,
            hasToken: !!currentToken,
            tokenPreview: currentToken ? currentToken.substring(0, 8) + '...' : null
        });
    } catch (error) {
        console.error('Status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/* Эндпоинт для получения данных арены */
app.get('/api/arena', async (req, res) => {
    try {
        if (!isRegistered) {
            return res.status(401).json({ error: 'Not registered' });
        }
        
        // Обновляем данные если они старые
        if (!arenaData || Date.now() - lastUpdateTime > 2000) {
            await fetchArenaData();
        }
        
        res.json(arenaData);
    } catch (error) {
        console.error('Error getting arena data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/* Эндпоинт для регистрации на раунд */
app.post('/api/register', async (req, res) => {
    try {
        const result = await registerForRound();
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Successfully registered for round',
                data: result.data 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                error: result.error 
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/* Главная страница - Vue.js приложение */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* Страница карты - редирект на главную (Vue.js обработает маршрутизацию) */
app.get('/map', (req, res) => {
    res.redirect('/');
});

/* Пустой запрос */
app.all('*', (req, res) => {
    res.status(404).send('Not Found');
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Map available at: http://localhost:${port}/map`);
});