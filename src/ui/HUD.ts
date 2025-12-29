export class HUD {
    private container: HTMLElement;
    private speedElement: HTMLElement;
    private lapTimeElement: HTMLElement;
    private totalTimeElement: HTMLElement;
    private lapCountElement: HTMLElement;
    
    private startTime: number = 0;
    private lapStartTime: number = 0;
    private currentLap: number = 1;
    private totalLaps: number = 3;
    private bestLapTime: number = Infinity;
    private fpsElement: HTMLElement | null = null;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'hud';
        this.createHUD();
        
        const uiContainer = document.getElementById('ui-container');
        if (uiContainer) {
            uiContainer.appendChild(this.container);
        }

        this.speedElement = document.getElementById('speed-value')!;
        this.lapTimeElement = document.getElementById('lap-time')!;
        this.totalTimeElement = document.getElementById('total-time')!;
        this.lapCountElement = document.getElementById('lap-count')!;
        this.fpsElement = document.getElementById('fps-counter')!;
    }

    private createHUD(): void {
        this.container.innerHTML = `
            <style>
                #hud {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 50;
                }

                #hud.hidden {
                    display: none;
                }

                .hud-panel {
                    background: rgba(0, 0, 0, 0.6);
                    border-radius: 10px;
                    padding: 15px 20px;
                    color: white;
                    font-family: 'Courier New', monospace;
                }

                .speedometer {
                    position: absolute;
                    bottom: 30px;
                    left: 30px;
                }

                .speed-value {
                    font-size: 48px;
                    font-weight: bold;
                    color: #4CAF50;
                }

                .speed-label {
                    font-size: 18px;
                    color: #aaa;
                    margin-top: -10px;
                }

                .timer-panel {
                    position: absolute;
                    top: 30px;
                    right: 30px;
                    text-align: right;
                }

                .timer-row {
                    margin-bottom: 10px;
                    font-size: 18px;
                }

                .timer-label {
                    color: #aaa;
                    margin-right: 10px;
                }

                .timer-value {
                    color: #fff;
                    font-weight: bold;
                }

                .lap-counter {
                    position: absolute;
                    top: 30px;
                    left: 30px;
                    font-size: 32px;
                    font-weight: bold;
                }

                .controls-hint {
                    position: absolute;
                    bottom: 30px;
                    right: 30px;
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.6);
                }

                .fps-counter {
                    position: absolute;
                    top: 120px;
                    left: 30px;
                    font-size: 24px;
                    font-weight: bold;
                }

                .fps-value {
                    color: #4CAF50;
                }

                .fps-value.warning {
                    color: #FFA500;
                }

                .fps-value.critical {
                    color: #FF4444;
                }

                @media (max-width: 768px) {
                    .speedometer {
                        bottom: 20px;
                        left: 20px;
                    }

                    .speed-value {
                        font-size: 36px;
                    }

                    .timer-panel {
                        top: 20px;
                        right: 20px;
                    }

                    .timer-row {
                        font-size: 14px;
                    }

                    .lap-counter {
                        top: 20px;
                        left: 20px;
                        font-size: 24px;
                    }

                    .controls-hint {
                        display: none;
                    }
                }
            </style>

            <div class="hud-panel lap-counter">
                <div id="lap-count">Круг: 1 / 3</div>
            </div>

            <div class="hud-panel speedometer">
                <div class="speed-value" id="speed-value">0</div>
                <div class="speed-label">км/ч</div>
            </div>

            <div class="hud-panel timer-panel">
                <div class="timer-row">
                    <span class="timer-label">Время круга:</span>
                    <span class="timer-value" id="lap-time">00:00.000</span>
                </div>
                <div class="timer-row">
                    <span class="timer-label">Общее время:</span>
                    <span class="timer-value" id="total-time">00:00.000</span>
                </div>
            </div>

            <div class="hud-panel controls-hint">
                WASD / Стрелки - управление<br>
                З - пауза | К - респаун
            </div>

            <div class="hud-panel fps-counter">
                FPS: <span class="fps-value" id="fps-counter">60</span>
            </div>
        `;
    }

    startRace(): void {
        this.startTime = Date.now();
        this.lapStartTime = Date.now();
        this.currentLap = 1;
        this.updateLapCount();
    }

    updateSpeed(speed: number): void {
        // Конвертируем в км/ч (примерно)
        const kmh = Math.round(speed * 3.6);
        this.speedElement.textContent = kmh.toString();
    }

    updateTimers(): void {
        const now = Date.now();
        
        // Время круга
        const lapTime = now - this.lapStartTime;
        this.lapTimeElement.textContent = this.formatTime(lapTime);
        
        // Общее время
        const totalTime = now - this.startTime;
        this.totalTimeElement.textContent = this.formatTime(totalTime);
    }

    updateFPS(fps: number): void {
        if (!this.fpsElement) return;

        const roundedFPS = Math.round(fps);
        this.fpsElement.textContent = roundedFPS.toString();

        // Меняем цвет в зависимости от FPS
        this.fpsElement.className = 'fps-value';
        if (roundedFPS < 20) {
            this.fpsElement.classList.add('critical');
        } else if (roundedFPS < 40) {
            this.fpsElement.classList.add('warning');
        }
    }

    completeLap(): void {
        const lapTime = Date.now() - this.lapStartTime;
        
        if (lapTime < this.bestLapTime) {
            this.bestLapTime = lapTime;
        }
        
        this.currentLap++;
        this.lapStartTime = Date.now();
        this.updateLapCount();
    }

    private updateLapCount(): void {
        this.lapCountElement.textContent = `Круг: ${this.currentLap} / ${this.totalLaps}`;
    }

    private formatTime(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = ms % 1000;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }

    isRaceFinished(): boolean {
        return this.currentLap > this.totalLaps;
    }

    getTotalTime(): number {
        return Date.now() - this.startTime;
    }

    getBestLapTime(): number {
        return this.bestLapTime;
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

