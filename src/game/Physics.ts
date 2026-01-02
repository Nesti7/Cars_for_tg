import { Scene } from '@babylonjs/core';
import * as CANNON from 'cannon-es';

export class PhysicsManager {
    private world: CANNON.World;
    private bodies: Map<string, CANNON.Body> = new Map();

    constructor(_scene: Scene) {
        
        // Создаём физический мир
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0), // Гравитация как на Земле
        });

        // Настройки для оптимизации
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.allowSleep = true;
    }

    async init(): Promise<void> {
        console.log('Инициализация физики...');
        
        // Создаём материалы для физики
        const groundMaterial = new CANNON.Material('ground');
        const carMaterial = new CANNON.Material('car');
        
        // Контактный материал между машиной и землёй (улучшенный)
        const groundCarContact = new CANNON.ContactMaterial(
            groundMaterial,
            carMaterial,
            {
                friction: 0.7,  // Увеличено для лучшего сцепления
                restitution: 0.1, // Уменьшено чтобы не отскакивала
                contactEquationStiffness: 1e8,
                contactEquationRelaxation: 3,
            }
        );
        
        this.world.addContactMaterial(groundCarContact);
        
        console.log('Физика инициализирована');
    }

    update(deltaTime: number): void {
        // Обновляем физический мир с ограничением шага
        // Используем фиксированный шаг для стабильности и производительности
        const fixedTimeStep = 1 / 60; // 60 FPS
        const maxSubSteps = 2; // Уменьшено с 3 до 2 для производительности
        
        this.world.step(fixedTimeStep, deltaTime, maxSubSteps);
    }

    addBody(id: string, body: CANNON.Body): void {
        this.bodies.set(id, body);
        this.world.addBody(body);
    }

    removeBody(id: string): void {
        const body = this.bodies.get(id);
        if (body) {
            this.world.removeBody(body);
            this.bodies.delete(id);
        }
    }

    getBody(id: string): CANNON.Body | undefined {
        return this.bodies.get(id);
    }

    getWorld(): CANNON.World {
        return this.world;
    }
}

