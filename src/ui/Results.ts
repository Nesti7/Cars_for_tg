export class Results {
    private container: HTMLElement;
    private onRestartCallback?: () => void;
    private onShareCallback?: (totalTime: number) => void;
    private lastTotalTime: number = 0;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'results';
        this.createResults();
        
        const uiContainer = document.getElementById('ui-container');
        if (uiContainer) {
            uiContainer.appendChild(this.container);
        }
    }

    private createResults(): void {
        this.container.innerHTML = `
            <style>
                #results {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 200;
                }

                #results.hidden {
                    display: none;
                }

                .results-title {
                    font-size: 48px;
                    font-weight: bold;
                    margin-bottom: 40px;
                    color: #4CAF50;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                }

                .results-stats {
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 15px;
                    padding: 30px 50px;
                    margin-bottom: 40px;
                }

                .result-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    font-size: 24px;
                }

                .result-label {
                    color: #aaa;
                    margin-right: 40px;
                }

                .result-value {
                    color: #fff;
                    font-weight: bold;
                }

                .result-value.best {
                    color: #FFD700;
                }

                .restart-button {
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

                .restart-button:hover {
                    background: #45a049;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.4);
                }

                .restart-button:active {
                    transform: translateY(0);
                }

                @media (max-width: 768px) {
                    .results-title {
                        font-size: 32px;
                    }

                    .results-stats {
                        padding: 20px 30px;
                    }

                    .result-row {
                        font-size: 18px;
                        margin-bottom: 15px;
                    }

                    .result-label {
                        margin-right: 20px;
                    }
                }
            </style>

            <div class="results-title">🏁 Финиш!</div>
            
            <div class="results-stats">
                <div class="result-row">
                    <span class="result-label">Общее время:</span>
                    <span class="result-value" id="total-time-result">00:00.000</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Лучший круг:</span>
                    <span class="result-value best" id="best-lap-result">00:00.000</span>
                </div>
            </div>

            <button class="restart-button" id="restart-button">Ещё раз!</button>
            <button class="restart-button" id="share-button" style="background: #2196F3; margin-top: 15px;">Поделиться 📤</button>
        `;

        const restartButton = this.container.querySelector('#restart-button');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                this.restart();
            });
        }

        const shareButton = this.container.querySelector('#share-button');
        if (shareButton) {
            shareButton.addEventListener('click', () => {
                this.share();
            });
        }
    }

    showResults(totalTime: number, bestLapTime: number): void {
        this.lastTotalTime = totalTime;
        
        const totalTimeElement = this.container.querySelector('#total-time-result');
        const bestLapElement = this.container.querySelector('#best-lap-result');

        if (totalTimeElement) {
            totalTimeElement.textContent = this.formatTime(totalTime);
        }

        if (bestLapElement) {
            bestLapElement.textContent = this.formatTime(bestLapTime);
        }

        this.show();
    }

    private formatTime(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = ms % 1000;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }

    private restart(): void {
        this.hide();
        
        if (this.onRestartCallback) {
            this.onRestartCallback();
        }
    }

    private share(): void {
        if (this.onShareCallback) {
            this.onShareCallback(this.lastTotalTime);
        }
    }

    onRestart(callback: () => void): void {
        this.onRestartCallback = callback;
    }

    onShare(callback: (totalTime: number) => void): void {
        this.onShareCallback = callback;
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

