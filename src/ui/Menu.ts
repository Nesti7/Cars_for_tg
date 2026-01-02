import { CarConfig } from '../game/Car';
import { Color3 } from '@babylonjs/core';

export class Menu {
    private container: HTMLElement;
    private onStartCallback?: (carConfig: CarConfig) => void;
    private selectedCarIndex: number = 0;

    private carConfigs: CarConfig[] = [
        {
            name: 'Спортивная',
            mass: 800,
            maxSpeed: 50,
            acceleration: 100,
            handling: 2,
            color: new Color3(1, 0, 0), // Красная
        },
        {
            name: 'Сбалансированная',
            mass: 1000,
            maxSpeed: 40,
            acceleration: 80,
            handling: 3,
            color: new Color3(0, 0, 1), // Синяя
        },
        {
            name: 'Тяжёлая',
            mass: 1200,
            maxSpeed: 30,
            acceleration: 60,
            handling: 4,
            color: new Color3(0, 0.5, 0), // Зелёная
        },
    ];

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'menu';
        this.createMenu();
        
        const uiContainer = document.getElementById('ui-container');
        if (uiContainer) {
            uiContainer.appendChild(this.container);
        }
    }

    private createMenu(): void {
        this.container.innerHTML = `
            <style>
                #menu {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 100;
                }

                #menu.hidden {
                    display: none;
                }

                .menu-title {
                    font-size: 48px;
                    font-weight: bold;
                    margin-bottom: 40px;
                    color: #fff;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                }

                .car-selection {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 40px;
                }

                .car-card {
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 10px;
                    padding: 20px;
                    width: 200px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .car-card:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.05);
                }

                .car-card.selected {
                    border-color: #4CAF50;
                    background: rgba(76, 175, 80, 0.2);
                }

                .car-name {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    text-align: center;
                }

                .car-stats {
                    font-size: 14px;
                    line-height: 1.8;
                }

                .car-stat {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                }

                .stat-label {
                    color: #aaa;
                }

                .stat-value {
                    color: #fff;
                    font-weight: bold;
                }

                .start-button {
                    background: #4CAF50;
                    border: none;
                    border-radius: 25px;
                    padding: 15px 50px;
                    font-size: 24px;
                    font-weight: bold;
                    color: white;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                }

                .start-button:hover {
                    background: #45a049;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.4);
                }

                .start-button:active {
                    transform: translateY(0);
                }

                @media (max-width: 768px) {
                    .menu-title {
                        font-size: 32px;
                    }

                    .car-selection {
                        flex-direction: column;
                        gap: 15px;
                    }

                    .car-card {
                        width: 250px;
                    }
                }
            </style>

            <div class="menu-title">🏎️ 3D Гоночки</div>
            
            <div class="car-selection" id="car-selection">
                ${this.carConfigs.map((car, index) => `
                    <div class="car-card ${index === 0 ? 'selected' : ''}" data-index="${index}">
                        <div class="car-name">${car.name}</div>
                        <div class="car-stats">
                            <div class="car-stat">
                                <span class="stat-label">Скорость:</span>
                                <span class="stat-value">${this.getStatBar(car.maxSpeed, 50)}</span>
                            </div>
                            <div class="car-stat">
                                <span class="stat-label">Ускорение:</span>
                                <span class="stat-value">${this.getStatBar(car.acceleration, 100)}</span>
                            </div>
                            <div class="car-stat">
                                <span class="stat-label">Управление:</span>
                                <span class="stat-value">${this.getStatBar(car.handling, 4)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <button class="start-button" id="start-button">Начать гонку!</button>
        `;

        // Обработчики событий
        const carCards = this.container.querySelectorAll('.car-card');
        carCards.forEach((card) => {
            card.addEventListener('click', () => {
                const index = parseInt((card as HTMLElement).dataset.index || '0');
                this.selectCar(index);
            });
        });

        const startButton = this.container.querySelector('#start-button');
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.startGame();
            });
        }
    }

    private getStatBar(value: number, max: number): string {
        const percentage = Math.round((value / max) * 100);
        const bars = Math.round(percentage / 20);
        return '█'.repeat(bars) + '░'.repeat(5 - bars);
    }

    private selectCar(index: number): void {
        this.selectedCarIndex = index;
        
        const cards = this.container.querySelectorAll('.car-card');
        cards.forEach((card, i) => {
            if (i === index) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    private startGame(): void {
        this.hide();
        
        if (this.onStartCallback) {
            this.onStartCallback(this.carConfigs[this.selectedCarIndex]);
        }
    }

    onStart(callback: (carConfig: CarConfig) => void): void {
        this.onStartCallback = callback;
    }

    show(): void {
        this.container.classList.remove('hidden');
    }

    hide(): void {
        this.container.classList.add('hidden');
    }

    dispose(): void {
        this.container.remove();
    }
}

