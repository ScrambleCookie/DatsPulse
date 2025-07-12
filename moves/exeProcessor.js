const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Функция для работы с exe файлом генерации ходов
 * @param {Object} mapData - JSON данные карты для записи в inputFile.json
 * @returns {Promise<Object>} - Promise с данными ходов из outputFile.json
 */
async function generateMovesWithExe(mapData) {
    const movesDir = __dirname;
    const inputFile = path.join(movesDir, 'inputFile.json');
    const outputFile = path.join(movesDir, 'outputFile.json');
    const exeFile = path.join(movesDir, 'DimasModule.exe');
    
    try {
        // Проверяем существование exe файла
        if (!fs.existsSync(exeFile)) {
            throw new Error(`Exe file not found: ${exeFile}`);
        }
        
        // Записываем входные данные в inputFile.json
        console.log('Writing input data to inputFile.json...');
        fs.writeFileSync(inputFile, JSON.stringify(mapData, null, 2), 'utf8');
        console.log('Input data written successfully');
        
        // Удаляем outputFile.json если он существует
        if (fs.existsSync(outputFile)) {
            fs.unlinkSync(outputFile);
            console.log('Previous output file removed');
        }
        
        // Запускаем exe файл
        console.log('Starting DimasModule.exe...');
        const result = await runExeFile(exeFile);
        
        if (result.code !== 0) {
            throw new Error(`Exe file exited with code ${result.code}: ${result.stderr}`);
        }
        
        console.log('DimasModule.exe completed successfully');
        console.log('Stdout:', result.stdout);
        
        // Читаем результат из outputFile.json
        console.log('Reading output data from outputFile.json...');
        
        // Проверяем что файл существует
        if (!fs.existsSync(outputFile)) {
            throw new Error(`Output file not created: ${outputFile}`);
        }
        
        const outputData = fs.readFileSync(outputFile, 'utf8');
        const movesData = JSON.parse(outputData);
        
        console.log('Output data read successfully');
        console.log('Generated moves count:', movesData.moves ? movesData.moves.length : 0);
        
        return movesData;
        
    } catch (error) {
        console.error('Error in generateMovesWithExe:', error.message);
        throw error;
    }
}

/**
 * Запуск exe файла и ожидание его завершения
 * @param {string} exePath - Путь к exe файлу
 * @returns {Promise<Object>} - Promise с результатом выполнения
 */
function runExeFile(exePath) {
    return new Promise((resolve, reject) => {
        const process = spawn(exePath, [], {
            cwd: path.dirname(exePath),
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        process.on('close', (code) => {
            resolve({
                code: code,
                stdout: stdout,
                stderr: stderr
            });
        });
        
        process.on('error', (error) => {
            reject(new Error(`Failed to start process: ${error.message}`));
        });
        
        // Таймаут на случай зависания
        setTimeout(() => {
            process.kill('SIGTERM');
            reject(new Error('Process timeout'));
        }, 30000); // 30 секунд таймаут
    });
}

module.exports = {
    generateMovesWithExe
};
