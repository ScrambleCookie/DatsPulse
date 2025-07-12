// Демонстрационные данные для тестирования визуализации
const demoArenaData = {
    "ants": [
        { "id": "ant1", "type": 0, "q": 0, "r": 0, "health": 130, "food": null },
        { "id": "ant2", "type": 1, "q": 1, "r": 0, "health": 180, "food": null },
        { "id": "ant3", "type": 2, "q": -1, "r": 1, "health": 80, "food": { "type": 1, "amount": 2 } }
    ],
    "enemies": [
        { "id": "enemy1", "type": 1, "q": 3, "r": 2, "health": 150, "food": null },
        { "id": "enemy2", "type": 0, "q": 2, "r": 3, "health": 100, "food": null }
    ],
    "food": [
        { "q": 2, "r": 1, "type": 1, "amount": 5 },
        { "q": -2, "r": 2, "type": 2, "amount": 3 },
        { "q": 1, "r": -2, "type": 3, "amount": 1 }
    ],
    "home": [
        { "q": 0, "r": 0 },
        { "q": -1, "r": 0 },
        { "q": 0, "r": -1 }
    ],
    "map": [
        { "q": 0, "r": 0, "type": 1, "cost": 1 },
        { "q": -1, "r": 0, "type": 1, "cost": 1 },
        { "q": 0, "r": -1, "type": 1, "cost": 1 },
        { "q": 1, "r": 0, "type": 2, "cost": 1 },
        { "q": -1, "r": 1, "type": 2, "cost": 1 },
        { "q": 0, "r": 1, "type": 2, "cost": 1 },
        { "q": 1, "r": -1, "type": 2, "cost": 1 },
        { "q": -1, "r": -1, "type": 2, "cost": 1 },
        { "q": 2, "r": 0, "type": 3, "cost": 2 },
        { "q": 2, "r": 1, "type": 2, "cost": 1 },
        { "q": -2, "r": 2, "type": 2, "cost": 1 },
        { "q": 1, "r": -2, "type": 2, "cost": 1 },
        { "q": 3, "r": 2, "type": 4, "cost": 1 },
        { "q": 2, "r": 3, "type": 2, "cost": 1 },
        { "q": -2, "r": 1, "type": 5, "cost": Infinity }
    ],
    "nextTurnIn": 1.5,
    "score": 150,
    "spot": { "q": 0, "r": 0 },
    "turnNo": 42
};

module.exports = demoArenaData;
