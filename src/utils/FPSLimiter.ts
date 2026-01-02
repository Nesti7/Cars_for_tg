export class FPSLimiter {
    private targetFPS: number;
    private frameTime: number;
    private lastFrameTime: number = 0;

    constructor(targetFPS: number = 60) {
        this.targetFPS = targetFPS;
        this.frameTime = 1000 / targetFPS;
    }

    shouldRender(currentTime: number): boolean {
        const elapsed = currentTime - this.lastFrameTime;
        
        if (elapsed >= this.frameTime) {
            this.lastFrameTime = currentTime - (elapsed % this.frameTime);
            return true;
        }
        
        return false;
    }

    setTargetFPS(fps: number): void {
        this.targetFPS = fps;
        this.frameTime = 1000 / fps;
    }

    getTargetFPS(): number {
        return this.targetFPS;
    }
}

