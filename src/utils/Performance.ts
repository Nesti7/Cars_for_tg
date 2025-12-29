import { Engine, Scene } from '@babylonjs/core';

export enum QualityLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

export class PerformanceManager {
    private engine: Engine;
    private scene: Scene;
    private qualityLevel: QualityLevel;
    private fpsHistory: number[] = [];
    private readonly FPS_HISTORY_SIZE = 60;

    constructor(engine: Engine, scene: Scene) {
        this.engine = engine;
        this.scene = scene;
        
        // Определяем начальный уровень качества
        this.qualityLevel = this.detectQualityLevel();
        this.applyQualitySettings();
    }

    private detectQualityLevel(): QualityLevel {
        // Определяем мощность устройства
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const memory = (performance as any).memory?.jsHeapSizeLimit || 0;
        const cores = navigator.hardwareConcurrency || 2;

        if (isMobile || memory < 1000000000 || cores <= 2) {
            return QualityLevel.LOW;
        } else if (memory < 2000000000 || cores <= 4) {
            return QualityLevel.MEDIUM;
        } else {
            return QualityLevel.HIGH;
        }
    }

    private applyQualitySettings(): void {
        console.log(`Применение настроек качества: ${this.qualityLevel}`);

        switch (this.qualityLevel) {
            case QualityLevel.LOW:
                // Минимальные настройки для слабых устройств
                this.engine.setHardwareScalingLevel(1.5); // Уменьшаем разрешение
                this.scene.autoClear = true; // Исправлено: всегда true
                this.scene.autoClearDepthAndStencil = true; // Исправлено: всегда true
                this.scene.blockMaterialDirtyMechanism = true;
                break;

            case QualityLevel.MEDIUM:
                this.engine.setHardwareScalingLevel(1.2);
                this.scene.autoClear = true;
                this.scene.autoClearDepthAndStencil = true;
                break;

            case QualityLevel.HIGH:
                this.engine.setHardwareScalingLevel(1.0);
                this.scene.autoClear = true;
                this.scene.autoClearDepthAndStencil = true;
                break;
        }
    }

    update(): void {
        // Отслеживаем FPS
        const fps = this.engine.getFps();
        this.fpsHistory.push(fps);

        if (this.fpsHistory.length > this.FPS_HISTORY_SIZE) {
            this.fpsHistory.shift();
        }

        // Автоматическая адаптация качества
        if (this.fpsHistory.length >= this.FPS_HISTORY_SIZE) {
            const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

            // Если FPS слишком низкий, понижаем качество
            if (avgFps < 25 && this.qualityLevel !== QualityLevel.LOW) {
                this.downgradeQuality();
            }
            // Если FPS стабильно высокий, можно повысить качество
            else if (avgFps > 55 && this.qualityLevel !== QualityLevel.HIGH) {
                this.upgradeQuality();
            }
        }
    }

    private downgradeQuality(): void {
        if (this.qualityLevel === QualityLevel.HIGH) {
            this.qualityLevel = QualityLevel.MEDIUM;
        } else if (this.qualityLevel === QualityLevel.MEDIUM) {
            this.qualityLevel = QualityLevel.LOW;
        }
        
        this.applyQualitySettings();
        this.fpsHistory = []; // Сбрасываем историю
        console.log('Качество понижено до:', this.qualityLevel);
    }

    private upgradeQuality(): void {
        if (this.qualityLevel === QualityLevel.LOW) {
            this.qualityLevel = QualityLevel.MEDIUM;
        } else if (this.qualityLevel === QualityLevel.MEDIUM) {
            this.qualityLevel = QualityLevel.HIGH;
        }
        
        this.applyQualitySettings();
        this.fpsHistory = []; // Сбрасываем историю
        console.log('Качество повышено до:', this.qualityLevel);
    }

    getQualityLevel(): QualityLevel {
        return this.qualityLevel;
    }

    getFPS(): number {
        return this.engine.getFps();
    }

    getAverageFPS(): number {
        if (this.fpsHistory.length === 0) return 0;
        return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    }
}

