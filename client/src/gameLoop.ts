type UpdateFn = (currentTick: number) => void;
const noop = () => {};

class GameLoop {
    private currentTick: number = 0;
    private lastTime: number = performance.now();
    private isRunning: boolean = false;
    private requestId: number | null = null;
    private tickInterval: number = 10;
    private updateFn: UpdateFn = noop;
    private animationRunner: AnimationRunner;

    constructor(animationRunner: AnimationRunner) {
        this.animationRunner = animationRunner;
    }

    public setTickInterval(tickInterval: number) {
        this.tickInterval = tickInterval;
        return this;
    }

    public setHostEngineUpdateFn(updateFn: UpdateFn) {
        this.updateFn = updateFn;
        return this;
    }

    private gameLoop = (time: number) => {
        let delta = time - this.lastTime;

        while (delta >= this.tickInterval) {
            this.currentTick++;
            delta -= this.tickInterval;
            this.updateFn(this.currentTick);
            this.animationRunner.runAnimations(this.currentTick);
            this.lastTime += this.tickInterval;
        }

        this.requestId = requestAnimationFrame(this.gameLoop);
    };

    private startLoop() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.requestId = requestAnimationFrame(this.gameLoop);
    }

    private pauseLoop() {
        this.isRunning = false;
        if (!this.requestId) return;
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
    }

    public start() {
        if (this.isRunning) return;
        this.currentTick = 0;
        this.lastTime = performance.now();
        this.startLoop();
    }

    public pause() {
        this.pauseLoop();
    }

    public continue() {
        this.startLoop();
    }
}

class AnimationRunner {
    private animations: Map<UpdateFn, number> = new Map();

    registerAnimation(animation: UpdateFn, tickInterval: number) {
        this.animations.set(animation, tickInterval);
    }

    unregisterAnimation(animation: UpdateFn) {
        this.animations.delete(animation);
    }

    runAnimations(currentTick: number) {
        for (const [animate, tickInterval] of this.animations.entries()) {
            if (currentTick % tickInterval === 0) animate(currentTick);
        }
    }
}

export const animationRunner = new AnimationRunner();
export const gameLoop = new GameLoop(animationRunner).setTickInterval(10);
