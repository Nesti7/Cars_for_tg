import { Scene, Mesh, MeshBuilder, Vector3, StandardMaterial, Color3 } from '@babylonjs/core';
import * as CANNON from 'cannon-es';
import { PhysicsManager } from './Physics';

export class Track {
    private scene: Scene;
    private physicsManager: PhysicsManager;
    private trackMesh!: Mesh;
    private groundBody!: CANNON.Body;
    private checkpoints: Vector3[] = [];

    constructor(scene: Scene, physicsManager: PhysicsManager) {
        this.scene = scene;
        this.physicsManager = physicsManager;

        // Создаём трассу
        this.createTrack();
        this.createCheckpoints();
    }

    private createTrack(): void {
        // Создаём ПРОСТУЮ ПРЯМУЮ ДОРОГУ (КОРОТКАЯ для производительности)
        this.trackMesh = MeshBuilder.CreateBox('track', {
            width: 15,  // Ширина дороги (уменьшено)
            height: 0.1, // Толщина
            depth: 100, // Длина дороги (уменьшено вдвое!)
        }, this.scene);
        
        this.trackMesh.position.y = -0.05; // Немного ниже для визуализации

        // Материал для дороги (оптимизированный)
        const trackMaterial = new StandardMaterial('trackMaterial', this.scene);
        trackMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3); // Серый асфальт
        trackMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        trackMaterial.freeze(); // Замораживаем материал
        this.trackMesh.material = trackMaterial;
        
        // Замораживаем меш (он статичный)
        this.trackMesh.freezeWorldMatrix();

        // Создаём физическое тело для дороги (ПЛОСКОСТЬ вместо бокса!)
        const groundShape = new CANNON.Plane();
        this.groundBody = new CANNON.Body({
            mass: 0, // Статическое тело
            shape: groundShape,
        });
        
        // Поворачиваем плоскость горизонтально
        this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.groundBody.position.set(0, 0, 0);
        
        this.physicsManager.addBody('ground', this.groundBody);

        // Создаём траву по бокам
        this.createGrass();
    }

    private createGrass(): void {
        // Левая трава (меньше)
        const grassLeft = MeshBuilder.CreateBox('grassLeft', {
            width: 30,
            height: 0.1,
            depth: 100,
        }, this.scene);
        grassLeft.position.set(-22.5, -0.1, 0);

        // Правая трава (меньше)
        const grassRight = MeshBuilder.CreateBox('grassRight', {
            width: 30,
            height: 0.1,
            depth: 100,
        }, this.scene);
        grassRight.position.set(22.5, -0.1, 0);

        const grassMaterial = new StandardMaterial('grassMaterial', this.scene);
        grassMaterial.diffuseColor = new Color3(0.2, 0.6, 0.2); // Зелёная трава
        grassMaterial.freeze();
        
        grassLeft.material = grassMaterial;
        grassRight.material = grassMaterial;
        
        grassLeft.freezeWorldMatrix();
        grassRight.freezeWorldMatrix();
    }


    private createCheckpoints(): void {
        // Создаём чекпоинты ВДОЛЬ ПРЯМОЙ ДОРОГИ (меньше)
        const checkpointCount = 3; // Уменьшено с 5 до 3
        const spacing = 80 / (checkpointCount - 1); // Расстояние между чекпоинтами
        
        for (let i = 0; i < checkpointCount; i++) {
            const z = -40 + (i * spacing); // От -40 до +40
            
            const checkpoint = new Vector3(0, 0, z);
            this.checkpoints.push(checkpoint);

            // Визуализация чекпоинта (полоса через дорогу)
            const checkpointMesh = MeshBuilder.CreateBox(`checkpoint_${i}`, {
                width: 15, // Ширина дороги
                height: 0.1,
                depth: 1,
            }, this.scene);
            
            checkpointMesh.position = checkpoint;
            checkpointMesh.position.y = 0.15;

            const checkpointMaterial = new StandardMaterial(`checkpointMaterial_${i}`, this.scene);
            checkpointMaterial.diffuseColor = new Color3(1, 1, 0); // Жёлтый
            checkpointMaterial.alpha = 0.3;
            checkpointMaterial.freeze();
            checkpointMesh.material = checkpointMaterial;
            
            checkpointMesh.freezeWorldMatrix();
        }

        // Финишная линия (последний чекпоинт)
        const finishLine = MeshBuilder.CreateBox('finishLine', {
            width: 15,
            height: 0.1,
            depth: 2,
        }, this.scene);
        
        finishLine.position = this.checkpoints[checkpointCount - 1];
        finishLine.position.y = 0.15;

        const finishMaterial = new StandardMaterial('finishMaterial', this.scene);
        finishMaterial.diffuseColor = new Color3(1, 1, 1); // Белый
        finishMaterial.alpha = 0.5;
        finishMaterial.freeze();
        finishLine.material = finishMaterial;
        
        finishLine.freezeWorldMatrix();
    }

    getCheckpoints(): Vector3[] {
        return this.checkpoints;
    }

    getStartPosition(): Vector3 {
        // Стартовая позиция в начале прямой дороги (ВЫШЕ, чтобы не застревать!)
        return new Vector3(0, 5, -40); // Высоко над дорогой
    }

    dispose(): void {
        this.trackMesh.dispose();
    }
}

