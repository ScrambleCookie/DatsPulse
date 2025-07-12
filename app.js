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

// Функция для генерации тестовых ходов
function generateTestMoves() {
    console.log('=== Generating test moves ===');
    console.log('Arena data exists:', !!arenaData);
    console.log('Ants array exists:', !!arenaData?.ants);
    console.log('Ants count:', arenaData?.ants?.length || 0);
    
    if (!arenaData || !arenaData.ants || arenaData.ants.length === 0) {
        console.log('No ants available for moves');
        return [];
    }
    
    // Покажем структуру первого муравья
    console.log('First ant structure:', JSON.stringify(arenaData.ants[0], null, 2));
    
    // Инициализируем локальные позиции муравьев, если они не были инициализированы
    for (const ant of arenaData.ants) {
        // Проверим все возможные варианты структуры ant
        console.log('Ant keys:', Object.keys(ant));
        
        let antId, antPosition;
        
        // Попробуем разные варианты идентификатора
        if (ant.uuid) {
            antId = ant.uuid;
        } else if (ant.id) {
            antId = ant.id;
        } else {
            console.log('Cannot find ant identifier');
            continue;
        }
        
        // Попробуем разные варианты позиции
        if (ant.position && ant.position.q !== undefined && ant.position.r !== undefined) {
            antPosition = { q: ant.position.q, r: ant.position.r };
        } else if (ant.q !== undefined && ant.r !== undefined) {
            antPosition = { q: ant.q, r: ant.r };
        } else {
            console.log('Cannot find ant position for ant:', antId);
            continue;
        }
        
        if (!localAntPositions.has(antId)) {
            localAntPositions.set(antId, antPosition);
            console.log(`Initialized position for ant ${antId}: (${antPosition.q}, ${antPosition.r})`);
        }
    }

    const moves = [];
    
    // Направления в hex-сетке
    const directions = [
        { q: 0, r: -1 },  // Север
        { q: 1, r: -1 },  // Северо-восток
        { q: 1, r: 0 },   // Юго-восток
        { q: 0, r: 1 },   // Юг
        { q: -1, r: 1 },  // Юго-запад
        { q: -1, r: 0 }   // Северо-запад
    ];
    
    // Берем каждого муравья и отправляем в случайном направлении
    arenaData.ants.forEach(ant => {
        let antId;
        
        // Попробуем разные варианты идентификатора
        if (ant.uuid) {
            antId = ant.uuid;
        } else if (ant.id) {
            antId = ant.id;
        } else {
            console.log('Cannot find ant identifier in move generation');
            return;
        }
        
        // Используем локальную позицию вместо позиции из API
        const currentPos = localAntPositions.get(antId);
        
        if (!currentPos) {
            console.log(`Warning: No position found for ant ${antId}, skipping`);
            return;
        }
        
        // Случайное направление
        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
        
        // Новая позиция
        const newQ = currentPos.q + randomDirection.q;
        const newR = currentPos.r + randomDirection.r;
        
        // Создаем ход для этого муравья - используем правильную структуру API
        const move = {
            ant: antId,
            path: [
                {
                    q: newQ,
                    r: newR
                }
            ]
        };
        
        // Обновляем локальную позицию
        localAntPositions.set(antId, {
            q: newQ,
            r: newR
        });
        
        moves.push(move);
        console.log(`Ant ${antId} (type ${ant.type}) moving from (${currentPos.q}, ${currentPos.r}) to (${newQ}, ${newR})`);
    });
    
    console.log(`Generated ${moves.length} random moves for all ants`);
    return moves;
}

// Функция для выполнения хода
async function makeMove() {
    try {
        if (!isRegistered || !currentToken) {
            return null;
        }

        // Генерируем тестовые ходы
        const testMoves = generateTestMoves();

        const response = await axios.post(`${API_CONFIG.baseURL}/api/move?token=${currentToken}`, {
            moves: testMoves
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