import { Scene, Mesh, MeshBuilder, Vector3, StandardMaterial, Color3, Quaternion } from '@babylonjs/core';
import * as CANNON from 'cannon-es';
import { PhysicsManager } from './Physics';

export interface CarConfig {
    name: string;
    mass: number;
    maxSpeed: number;
    acceleration: number;
    handling: number;
    color: Color3;
}

export class Car {
    private scene: Scene;
    private physicsManager: PhysicsManager;
    private mesh: Mesh;
    public body: CANNON.Body; // Публичное для респауна
    private config: CarConfig;
    
    // Управление
    private controls = {
        forward: false,
        backward: false,
        left: false,
        right: false,
    };
    
    private currentSpeed: number = 0;
    private maxSpeed: number;
    private acceleration: number;
    private handling: number;

    constructor(scene: Scene, physicsManager: PhysicsManager, config: CarConfig, position: Vector3) {
        this.scene = scene;
        this.physicsManager = physicsManager;
        this.config = config;
        this.maxSpeed = config.maxSpeed;
        this.acceleration = config.acceleration;
        this.handling = config.handling;

        // Создаём визуальную модель машины (временно простой box)
        this.mesh = this.createCarMesh(position);
        
        // Создаём физическое тело
        this.body = this.createPhysicsBody(position);
        
        // Добавляем тело в физический мир
        this.physicsManager.addBody(`car_${config.name}`, this.body);
        
        // Настраиваем управление
        this.setupControls();
    }

    private createCarMesh(position: Vector3): Mesh {
        // Создаём простую модель машины из примитивов (увеличенная)
        const carBody = MeshBuilder.CreateBox('carBody', {
            width: 3,
            height: 1.5,
            depth: 6,
        }, this.scene);
        
        carBody.position = position;
        
        // Материал кузова (оптимизированный)
        const material = new StandardMaterial('carMaterial', this.scene);
        material.diffuseColor = this.config.color;
        material.specularColor = new Color3(0.2, 0.2, 0.2);
        material.freeze(); // Замораживаем материал для производительности
        carBody.material = material;
        
        // Оптимизации меша
        carBody.freezeWorldMatrix(); // Замораживаем матрицу (будем обновлять вручную)

        // Добавляем кабину (верхняя часть)
        const cabin = MeshBuilder.CreateBox('cabin', {
            width: 2.5,
            height: 1,
            depth: 3,
        }, this.scene);
        cabin.position = new Vector3(0, 1, 0.5);
        cabin.parent = carBody;
        cabin.material = material;
        
        // Создаём колёса (визуально, ближе к кузову)
        const wheelPositions = [
            new Vector3(-1.6, -0.75, 1.8),  // Переднее левое
            new Vector3(1.6, -0.75, 1.8),   // Переднее правое
            new Vector3(-1.6, -0.75, -1.8), // Заднее левое
            new Vector3(1.6, -0.75, -1.8),  // Заднее правое
        ];
        
        wheelPositions.forEach((pos, index) => {
            const wheel = MeshBuilder.CreateCylinder(`wheel_${index}`, {
                diameter: 1.2,
                height: 0.5,
            }, this.scene);
            
            wheel.rotation.z = Math.PI / 2;
            wheel.position = pos; // Относительная позиция от родителя
            wheel.parent = carBody;
            
            const wheelMaterial = new StandardMaterial(`wheelMaterial_${index}`, this.scene);
            wheelMaterial.diffuseColor = new Color3(0.1, 0.1, 0.1);
            wheel.material = wheelMaterial;
        });
        
        return carBody;
    }

    private createPhysicsBody(position: Vector3): CANNON.Body {
        // Уменьшаем размер физического тела, чтобы не застревать
        const shape = new CANNON.Box(new CANNON.Vec3(1.3, 0.6, 2.5));
        
        const body = new CANNON.Body({
            mass: this.config.mass,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape,
            linearDamping: 0.1, // Меньше демпинга для плавности
            angularDamping: 0.3,
        });
        
        // Запрещаем засыпание (чтобы не застревала)
        body.sleepSpeedLimit = 0.1;
        body.sleepTimeLimit = 1;
        
        return body;
    }

    private setupControls(): void {
        // Управление с клавиатуры
        window.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.controls.forward = true;
                    break;
                case 's':
                case 'arrowdown':
                    this.controls.backward = true;
                    break;
                case 'a':
                case 'arrowleft':
                    this.controls.left = true;
                    break;
                case 'd':
                case 'arrowright':
                    this.controls.right = true;
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.controls.forward = false;
                    break;
                case 's':
                case 'arrowdown':
                    this.controls.backward = false;
                    break;
                case 'a':
                case 'arrowleft':
                    this.controls.left = false;
                    break;
                case 'd':
                case 'arrowright':
                    this.controls.right = false;
                    break;
            }
        });
    }

    update(deltaTime: number): void {
        // Размораживаем матрицу для обновления
        this.mesh.unfreezeWorldMatrix();
        
        // Обновляем позицию меша по физическому телу
        this.mesh.position.set(
            this.body.position.x,
            this.body.position.y,
            this.body.position.z
        );
        
        this.mesh.rotationQuaternion = new Quaternion(
            this.body.quaternion.x,
            this.body.quaternion.y,
            this.body.quaternion.z,
            this.body.quaternion.w
        );
        
        // Замораживаем обратно
        this.mesh.freezeWorldMatrix();

        // Применяем управление
        this.applyControls(deltaTime);
    }

    private applyControls(_deltaTime: number): void {
        const forward = new CANNON.Vec3(0, 0, 1);
        const right = new CANNON.Vec3(1, 0, 0);
        
        // Поворачиваем векторы в соответствии с ориентацией машины
        this.body.quaternion.vmult(forward, forward);
        this.body.quaternion.vmult(right, right);

        // Ускорение/торможение
        if (this.controls.forward) {
            const force = forward.scale(this.acceleration * this.config.mass);
            this.body.applyForce(force, this.body.position);
        }
        
        if (this.controls.backward) {
            const force = forward.scale(-this.acceleration * this.config.mass * 0.5);
            this.body.applyForce(force, this.body.position);
        }

        // Поворот
        if (this.controls.left) {
            this.body.angularVelocity.y = this.handling;
        } else if (this.controls.right) {
            this.body.angularVelocity.y = -this.handling;
        } else {
            this.body.angularVelocity.y *= 0.9; // Затухание вращения
        }

        // Ограничение максимальной скорости
        const speed = this.body.velocity.length();
        if (speed > this.maxSpeed) {
            this.body.velocity.scale(this.maxSpeed / speed, this.body.velocity);
        }
        
        this.currentSpeed = speed;
    }

    getSpeed(): number {
        return this.currentSpeed;
    }

    getPosition(): Vector3 {
        return this.mesh.position;
    }

    getMesh(): Mesh {
        return this.mesh;
    }

    dispose(): void {
        this.mesh.dispose();
        this.physicsManager.removeBody(`car_${this.config.name}`);
    }
}

