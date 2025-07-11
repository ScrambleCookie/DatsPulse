const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { generateMapHTML } = require('./gui/map-html');
const { generateHomeHTML } = require('./gui/home-html');
const app = express();
const port = 8080;

app.use(cors({origin: '*'}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Кэш для данных арены
let arenaData = null;
let lastUpdateTime = 0;
let isRegistered = false;
let currentToken = null;

// Конфигурация для API
const API_CONFIG = {
    baseURL: 'https://games-test.datsteam.dev', // или 'https://games.datsteam.dev' для финальных раундов
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
async function registerForRound(token) {
    try {
        const response = await axios.post(`${API_CONFIG.baseURL}/api/register?token=${token}`, {}, {
            headers: {
                ...API_CONFIG.headers,
                'X-Auth-Token': token
            }
        });
        
        currentToken = token;
        isRegistered = true;
        console.log('Successfully registered for round');
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Registration failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Запуск периодического обновления данных
setInterval(fetchArenaData, 1000);

// Инициализация первого запроса
fetchArenaData();

/* Эндпоинт для регистрации на раунд */
app.post('/api/register', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const result = await registerForRound(token);
        
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

/* Эндпоинт для получения HTML карты */
app.get('/map', async (req, res) => {
    try {
        if (!isRegistered) {
            return res.redirect('/');
        }

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

/* Обработка стартовой страницы сайта */
app.get('/', (req, res) => {
    const homeHTML = generateHomeHTML(isRegistered, port);
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