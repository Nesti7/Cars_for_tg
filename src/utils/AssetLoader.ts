import { Scene, SceneLoader } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export class AssetLoader {
    private scene: Scene;
    private loadedAssets: Map<string, any> = new Map();

    constructor(scene: Scene) {
        this.scene = scene;
    }

    async loadModel(name: string, path: string): Promise<any> {
        if (this.loadedAssets.has(name)) {
            return this.loadedAssets.get(name);
        }

        try {
            const result = await SceneLoader.ImportMeshAsync('', path, '', this.scene);
            this.loadedAssets.set(name, result);
            return result;
        } catch (error) {
            console.error(`Ошибка загрузки модели ${name}:`, error);
            throw error;
        }
    }

    getAsset(name: string): any {
        return this.loadedAssets.get(name);
    }

    dispose(): void {
        this.loadedAssets.clear();
    }
}

