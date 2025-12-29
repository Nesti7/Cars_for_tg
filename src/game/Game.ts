import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Color4 } from '@babylonjs/core';
import { PhysicsManager } from './Physics';
import { Car, CarConfig } from './Car';
import { Track } from './Track';
import { Menu } from '../ui/Menu';
import { HUD } from '../ui/HUD';
import { Results } from '../ui/Results';
import { PerformanceManager } from '../utils/Performance';
import { TelegramIntegration } from '../utils/TelegramIntegration';

export class Game {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;
    private camera: ArcRotateCamera;
    private physicsManager: PhysicsManager;
    private performanceManager: PerformanceManager;
    private telegramIntegration: TelegramIntegration;
    private isRunning: boolean = false;
    
    // Игровые объекты
    private car: Car | null = null;
    private track: Track | null = null;
    
    // UI
    private menu: Menu;
    private hud: HUD;
    private results: Results;
    
    // Игровая логика
    private currentCheckpoint: number = 0;
    private raceStarted: boolean = false;
    private isPaused: boolean = false;
    private pauseOverlay: HTMLElement | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        
        // Создаём движок с максимальной оптимизацией для слабых устройств
        this.engine = new Engine(this.canvas, true, {
            preserveDrawingBuffer: false, // false для производительности
            stencil: false,
            antialias: false,
            powerPreference: 'high-performance',
            doNotHandleContextLost: true,
            disableWebGL2Support: false,
        });

        // Ограничиваем FPS для снижения нагрузки
        this.engine.setHardwareScalingLevel(1.2); // Уменьшаем разрешение

        // Создаём сцену с оптимизацией
        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0.5, 0.7, 1.0, 1.0); // Голубое небо
        
        // Исправляем проблемы с рендерингом
        this.scene.autoClear = true;
        this.scene.autoClearDepthAndStencil = true;
        
        // Оптимизации сцены
        this.scene.skipPointerMovePicking = true; // Отключаем picking для мыши
        this.scene.constantlyUpdateMeshUnderPointer = false;
        this.scene.blockMaterialDirtyMechanism = true; // Блокируем пересчёт материалов
        
        // Создаём камеру (следует за машиной, ближе)
        this.camera = new ArcRotateCamera(
            'camera',
            -Math.PI / 2,
            Math.PI / 3,
            25,
            Vector3.Zero(),
            this.scene
        );
        this.camera.attachControl(this.canvas, true);
        this.camera.lowerRadiusLimit = 15;
        this.camera.upperRadiusLimit = 50;

        // Создаём освещение
        const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;

        // Инициализируем физику
        this.physicsManager = new PhysicsManager(this.scene);
        
        // Инициализируем менеджер производительности
        this.performanceManager = new PerformanceManager(this.engine, this.scene);
        
        // Инициализируем интеграцию с Telegram
        this.telegramIntegration = new TelegramIntegration();
        
        // Создаём UI
        this.menu = new Menu();
        this.hud = new HUD();
        this.results = new Results();
        
        // Скрываем HUD и Results изначально
        this.hud.hide();
        this.results.hide();

        // Обработчики UI
        this.menu.onStart((carConfig) => this.startRace(carConfig));
        this.results.onRestart(() => this.restartGame());
        this.results.onShare((totalTime) => this.shareResults(totalTime));

        // Обработка изменения размера окна
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        // Создаём оверлей паузы
        this.createPauseOverlay();

        // Обработка клавиш паузы и респауна
        window.addEventListener('keydown', (e) => {
            // З - пауза
            if (e.key.toLowerCase() === 'з' || e.key.toLowerCase() === 'p') {
                this.togglePause();
            }
            // К - респаун
            if (e.key.toLowerCase() === 'к' || e.key.toLowerCase() === 'r') {
                if (this.raceStarted) {
                    this.respawnCar();
                }
            }
        });
    }

    private createPauseOverlay(): void {
        this.pauseOverlay = document.createElement('div');
        this.pauseOverlay.id = 'pause-overlay';
        this.pauseOverlay.innerHTML = `
            <style>
                #pause-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: none;
                    justify-content: center;
                    align-items: center;
                    z-index: 150;
                    flex-direction: column;
                }

                #pause-overlay.active {
                    display: flex;
                }

                .pause-title {
                    font-size: 72px;
                    font-weight: bold;
                    color: #fff;
                    margin-bottom: 30px;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                }

                .pause-hint {
                    font-size: 24px;
                    color: #aaa;
                }
            </style>
            <div class="pause-title">⏸️ ПАУЗА</div>
            <div class="pause-hint">Нажми З для продолжения</div>
        `;

        const uiContainer = document.getElementById('ui-container');
        if (uiContainer) {
            uiContainer.appendChild(this.pauseOverlay);
        }
    }

    private togglePause(): void {
        if (!this.raceStarted) return;

        this.isPaused = !this.isPaused;

        if (this.pauseOverlay) {
            if (this.isPaused) {
                this.pauseOverlay.classList.add('active');
            } else {
                this.pauseOverlay.classList.remove('active');
            }
        }

        console.log(this.isPaused ? 'Игра на паузе' : 'Игра продолжена');
    }

    private respawnCar(): void {
        if (!this.car || !this.track) return;

        console.log('Респаун машины...');

        // Получаем стартовую позицию
        const startPosition = this.track.getStartPosition();

        // КРИТИЧНО: Сбрасываем физику ПЕРЕД телепортацией
        this.car.body.velocity.set(0, 0, 0);
        this.car.body.angularVelocity.set(0, 0, 0);
        this.car.body.force.set(0, 0, 0);
        this.car.body.torque.set(0, 0, 0);
        
        // Телепортируем машину ВЫСОКО
        this.car.body.position.set(startPosition.x, startPosition.y, startPosition.z);
        this.car.body.quaternion.setFromEuler(0, 0, 0);
        
        // Пробуждаем тело
        this.car.body.wakeUp();

        // Сбрасываем прогресс
        this.currentCheckpoint = 0;

        this.telegramIntegration.hapticFeedback('medium');
        
        console.log('Машина респавнена на позиции:', startPosition, 'FPS:', Math.round(this.performanceManager.getFPS()));
    }

    async init(): Promise<void> {
        console.log('Инициализация игры...');
        
        // Инициализация физики
        await this.physicsManager.init();
        
        // Создаём трассу
        this.track = new Track(this.scene, this.physicsManager);
        
        console.log('Игра инициализирована');
    }

    start(): void {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        // Запускаем игровой цикл с ограничением FPS
        this.engine.runRenderLoop(() => {
            if (!this.isPaused) {
                this.update();
            }
            this.render();
        });
        
        console.log('Игровой цикл запущен');
    }

    private startRace(carConfig: CarConfig): void {
        console.log('Старт гонки с машиной:', carConfig.name);
        
        // Создаём машину
        if (this.car) {
            this.car.dispose();
        }
        
        const startPosition = this.track!.getStartPosition();
        this.car = new Car(this.scene, this.physicsManager, carConfig, startPosition);
        
        // Настраиваем камеру на машину
        this.camera.setTarget(this.car.getPosition());
        
        // Показываем HUD
        this.hud.show();
        this.hud.startRace();
        
        // Сбрасываем прогресс
        this.currentCheckpoint = 0;
        this.raceStarted = true;
    }

    private restartGame(): void {
        // Сбрасываем состояние
        if (this.car) {
            this.car.dispose();
            this.car = null;
        }
        
        this.currentCheckpoint = 0;
        this.raceStarted = false;
        
        // Показываем меню
        this.menu.show();
        this.hud.hide();
    }

    private update(): void {
        // Обновление физики
        this.physicsManager.update(this.engine.getDeltaTime() / 1000);
        
        // Обновление производительности
        this.performanceManager.update();
        
        // Обновление машины
        if (this.car && this.raceStarted) {
            this.car.update(this.engine.getDeltaTime() / 1000);
            
            // Обновляем камеру
            this.camera.setTarget(this.car.getPosition());
            
            // Обновляем HUD
            this.hud.updateSpeed(this.car.getSpeed());
            this.hud.updateTimers();
            this.hud.updateFPS(this.performanceManager.getFPS());
            
            // Проверяем чекпоинты
            this.checkCheckpoints();
            
            // Проверяем финиш
            if (this.hud.isRaceFinished()) {
                this.finishRace();
            }
        }
    }

    private checkCheckpoints(): void {
        if (!this.car || !this.track) return;
        
        const checkpoints = this.track.getCheckpoints();
        const carPos = this.car.getPosition();
        const nextCheckpoint = checkpoints[this.currentCheckpoint];
        
        // Проверяем расстояние до следующего чекпоинта (увеличено для прямой дороги)
        const distance = Vector3.Distance(carPos, nextCheckpoint);
        
        if (distance < 15) { // Увеличено с 5 до 15
            this.currentCheckpoint++;
            
            console.log(`Чекпоинт ${this.currentCheckpoint}/${checkpoints.length} пройден!`);
            
            // Если прошли все чекпоинты, завершаем круг
            if (this.currentCheckpoint >= checkpoints.length) {
                this.currentCheckpoint = 0;
                this.hud.completeLap();
                console.log('Круг завершён!');
            }
        }
    }

    private finishRace(): void {
        console.log('Гонка завершена!');
        
        this.raceStarted = false;
        
        // Тактильная обратная связь (если в Telegram)
        this.telegramIntegration.hapticFeedback('success');
        
        // Показываем результаты
        this.hud.hide();
        this.results.showResults(
            this.hud.getTotalTime(),
            this.hud.getBestLapTime()
        );
    }

    private shareResults(totalTime: number): void {
        const seconds = (totalTime / 1000).toFixed(2);
        const userName = this.telegramIntegration.getUserName();
        const text = `${userName} проехал гонку за ${seconds} секунд! 🏎️💨 Попробуй обогнать!`;
        
        this.telegramIntegration.shareScore(totalTime, text);
        this.telegramIntegration.hapticFeedback('light');
    }

    private render(): void {
        this.scene.render();
    }

    stop(): void {
        this.isRunning = false;
        this.engine.stopRenderLoop();
    }

    dispose(): void {
        if (this.car) {
            this.car.dispose();
        }
        if (this.track) {
            this.track.dispose();
        }
        this.menu.dispose();
        this.hud.dispose();
        this.results.dispose();
        this.scene.dispose();
        this.engine.dispose();
    }
}

