import { Game } from './game/Game';

// Инициализация игры при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    const canvasElement = document.getElementById('renderCanvas');
    const loadingElement = document.getElementById('loading');
    
    if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
        console.error('Canvas element not found!');
        return;
    }
    
    if (!loadingElement) {
        console.error('Loading element not found!');
        return;
    }
    
    const canvas = canvasElement;

    // Создаём экземпляр игры
    const game = new Game(canvas);
    
    // Инициализация игры
    game.init().then(() => {
        // Скрываем экран загрузки
        loadingElement.classList.add('hidden');
        
        // Запускаем игру
        game.start();
        
        console.log('Игра запущена!');
    }).catch((error) => {
        console.error('Ошибка инициализации игры:', error);
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = 'Ошибка загрузки игры';
        }
    });
});

