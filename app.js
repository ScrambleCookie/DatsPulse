const express = require('express');
const cors = require('cors');
const axios = require('axios');
const demoArenaData = require('./demo-data');
const { generateMapHTML } = require('./gui/map-html');
const { generateHomeHTML } = require('./gui/home-html');
const app = express();
const port = 8080;

// Флаг для демо-режима (когда нет доступа к API)
let DEMO_MODE = true;

app.use(cors({origin: '*'}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Кэш для данных арены
let arenaData = null;
let lastUpdateTime = 0;

// Конфигурация для API
const API_CONFIG = {
    baseURL: 'https://games-test.datsteam.dev', // или 'https://games.datsteam.dev' для финальных раундов
    headers: {
        'X-Auth-Token': 'YOUR_TOKEN_HERE', // Замените на ваш токен
        'Content-Type': 'application/json'
    }
};

// Функция для получения данных арены
async function fetchArenaData() {
    try {
        if (DEMO_MODE) {
            // Используем демо-данные с динамическими изменениями
            arenaData = { ...demoArenaData };
            // Имитируем изменения для демонстрации
            arenaData.turnNo = Math.floor(Date.now() / 2000) % 100;
            arenaData.nextTurnIn = 2 - (Date.now() % 2000) / 1000;
            arenaData.score = 150 + Math.floor(Math.sin(Date.now() / 10000) * 50);
            
            lastUpdateTime = Date.now();
            console.log(`Arena data updated (demo). Turn: ${arenaData.turnNo}, Next turn in: ${arenaData.nextTurnIn.toFixed(1)}s, Score: ${arenaData.score}`);
            return arenaData;
        }

        const response = await axios.get(`${API_CONFIG.baseURL}/api/arena`, {
            headers: API_CONFIG.headers
        });
        arenaData = response.data;
        lastUpdateTime = Date.now();
        console.log(`Arena data updated. Turn: ${arenaData.turnNo}, Next turn in: ${arenaData.nextTurnIn}s`);
        return arenaData;
    } catch (error) {
        console.error('Error fetching arena data:', error.message);
        // Переключаемся в демо-режим при ошибке
        arenaData = { ...demoArenaData };
        arenaData.turnNo = Math.floor(Date.now() / 2000) % 100;
        arenaData.nextTurnIn = 2 - (Date.now() % 2000) / 1000;
        lastUpdateTime = Date.now();
        return arenaData;
    }
}

// Запуск периодического обновления данных
setInterval(fetchArenaData, 1000);

// Инициализация первого запроса
fetchArenaData();

/* Эндпоинт для получения HTML карты */
app.get('/map', async (req, res) => {
    try {
        // Обновляем данные если они старые
        if (!arenaData || Date.now() - lastUpdateTime > 2000) {
            await fetchArenaData();
        }
        
        const mapHTML = generateMapHTML(arenaData);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(mapHTML);
    } catch (error) {
        console.error('Error generating map:', error);
        res.status(500).send('Error generating map');
    }
});

/* Эндпоинт для получения JSON данных арены */
app.get('/api/arena-data', async (req, res) => {
    try {
        if (!arenaData || Date.now() - lastUpdateTime > 2000) {
            await fetchArenaData();
        }
        res.json(arenaData);
    } catch (error) {
        console.error('Error fetching arena data:', error);
        res.status(500).json({ error: 'Failed to fetch arena data' });
    }
});

/* Эндпоинт для переключения режимов */
app.get('/toggle-demo', (req, res) => {
    DEMO_MODE = !DEMO_MODE;
    res.json({ 
        message: `Demo mode ${DEMO_MODE ? 'enabled' : 'disabled'}`,
        demoMode: DEMO_MODE 
    });
});

/* Обработка стартовой страницы сайта */
app.get('/', (req, res) => {
    const homeHTML = generateHomeHTML(DEMO_MODE, port);
    res.send(homeHTML);
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