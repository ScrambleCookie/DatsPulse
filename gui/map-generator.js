// Функция для генерации SVG гексагона
function generateHexagon(q, r, size, color, strokeColor = '#000', strokeWidth = 1) {
    const x = size * (3/2 * q);
    const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    
    // Координаты для правильного шестиугольника
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        points.push(`${px},${py}`);
    }
    
    return `<polygon points="${points.join(' ')}" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" data-q="${q}" data-r="${r}"/>`;
}

module.exports = {
    generateHexagon
};
