require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { generateMovesWithExe } = require('./moves/exeProcessor');
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

// Сохранение карты в рамках раунда
let roundMapCache = new Map(); // Кэш для сохранения всех гексов раунда
let currentRoundId = null;

// Конфигурация для API
const API_CONFIG = {
    baseURL: process.env.API_BASE_URL || 'https://games-test.datsteam.dev', // используем основной URL
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
        
        // Обновляем кэш карты
        updateMapCache(arenaData);
        
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
        
        // После регистрации получаем карту
        await fetchArenaData();
        
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

// Функция для обновления кэша карты
function updateMapCache(arenaData) {
    if (!arenaData) return;
    
    // Если это новый раунд, очищаем кэш
    if (currentRoundId !== arenaData.turnNo) {
        if (arenaData.turnNo === 1) {
            roundMapCache.clear();
            localAntPositions.clear(); // Сбрасываем позиции муравьев при новом раунде
            currentRoundId = arenaData.turnNo;
            console.log('New round started, clearing map cache and ant positions');
        } else {
            currentRoundId = arenaData.turnNo;
        }
    }
    
    // Обновляем кэш с текущими видимыми гексами
    if (arenaData.map) {
        arenaData.map.forEach(hex => {
            const key = `${hex.q},${hex.r}`;
            roundMapCache.set(key, {
                ...hex,
                lastSeen: Date.now(),
                isVisible: true
            });
        });
    }
}

// Функция для получения полной карты с учетом кэша
function getFullMapWithCache() {
    if (!arenaData) return null;
    
    const currentTime = Date.now();
    const visibleHexes = new Set();
    
    // Отмечаем видимые гексы
    if (arenaData.map) {
        arenaData.map.forEach(hex => {
            visibleHexes.add(`${hex.q},${hex.r}`);
        });
    }
    
    // Создаем полную карту
    const fullMap = [];
    
    // Добавляем все кэшированные гексы
    for (const [key, hex] of roundMapCache.entries()) {
        const isCurrentlyVisible = visibleHexes.has(key);
        fullMap.push({
            ...hex,
            isVisible: isCurrentlyVisible,
            isFromCache: !isCurrentlyVisible
        });
    }
    
    return {
        ...arenaData,
        map: fullMap,
        originalMap: arenaData.map // Сохраняем оригинальную карту
    };
}

// Локальное отслеживание позиций муравьев
let localAntPositions = new Map();

// Функция для выполнения хода
async function makeMove() {
    try {
        if (!isRegistered || !currentToken) {
            return null;
        }

        // Генерируем ходы с помощью exe файла
        const movesData = await generateMovesWithExe(arenaData);
        const moves = movesData.moves || [];

        const response = await axios.post(`${API_CONFIG.baseURL}/api/move?token=${currentToken}`, {
            moves: moves
        }, {
            headers: {
                ...API_CONFIG.headers,
                'X-Auth-Token': currentToken
            }
        });
        
        arenaData = response.data;
        lastUpdateTime = Date.now();
        
        // Обновляем кэш карты
        updateMapCache(arenaData);
        
        console.log(`Move executed. Turn: ${arenaData.turnNo}, Next turn in: ${arenaData.nextTurnIn}s`);
        console.log(`Map hexes count: ${arenaData.map ? arenaData.map.length : 0}`);
        console.log(`Ants positions:`, arenaData.ants?.map(ant => `${ant.id.slice(0,8)}...(${ant.q},${ant.r})`));
        
        return arenaData;
    } catch (error) {
        console.error('Error making move:', error.message);
        return null;
    }
}

// Запуск периодического обновления данных (используем makeMove вместо fetchArenaData)
setInterval(makeMove, 1000);

// Инициализация первого запроса
fetchArenaData();

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
        
        // Всегда возвращаем свежие данные без кэша для отладки
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

/* Эндпоинт для выполнения хода */
app.post('/api/move', async (req, res) => {
    try {
        if (!isRegistered) {
            return res.status(401).json({ error: 'Not registered' });
        }
        
        const result = await makeMove();
        
        if (result) {
            // Возвращаем только свежие данные без кэша для отладки
            res.json(result);
        } else {
            res.status(500).json({ error: 'Failed to make move' });
        }
    } catch (error) {
        console.error('Move error:', error);
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