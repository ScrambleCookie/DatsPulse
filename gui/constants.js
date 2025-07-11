// Типы гексов
const HEX_TYPES = {
    1: { name: 'муравейник', color: '#8B4513', cost: 1 },
    2: { name: 'пустой', color: '#90EE90', cost: 1 },
    3: { name: 'грязь', color: '#8B4513', cost: 2 },
    4: { name: 'кислота', color: '#FFFF00', cost: 1 },
    5: { name: 'камни', color: '#808080', cost: Infinity }
};

// Типы ресурсов
const RESOURCE_TYPES = {
    1: { name: 'яблоко', color: '#FF0000', calories: 10 },
    2: { name: 'хлеб', color: '#DEB887', calories: 20 },
    3: { name: 'нектар', color: '#FFD700', calories: 60 }
};

// Типы муравьев
const ANT_TYPES = {
    0: { name: 'Рабочий', color: '#8B4513', hp: 130, attack: 30, cargo: 8, vision: 1, speed: 5 },
    1: { name: 'Боец', color: '#FF0000', hp: 180, attack: 70, cargo: 2, vision: 1, speed: 4 },
    2: { name: 'Разведчик', color: '#0000FF', hp: 80, attack: 20, cargo: 2, vision: 4, speed: 7 }
};

module.exports = {
    HEX_TYPES,
    RESOURCE_TYPES,
    ANT_TYPES
};
