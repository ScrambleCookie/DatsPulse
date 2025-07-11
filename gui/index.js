// GUI Module для DatsPulse Arena Visualizer
// Экспорт всех функций интерфейса

const { generateMapHTML } = require('./map-html');
const { generateHomeHTML } = require('./home-html');
const { generateHexagon } = require('./map-generator');
const { HEX_TYPES, RESOURCE_TYPES, ANT_TYPES } = require('./constants');

module.exports = {
    generateMapHTML,
    generateHomeHTML,
    generateHexagon,
    HEX_TYPES,
    RESOURCE_TYPES,
    ANT_TYPES
};
