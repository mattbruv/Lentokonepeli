type UpdateFn = (currentTick: number) => void;
const noop = () => {};

/**
 * When facing a case where useInterval seems handy, use this GameLoop instead
 */
class GameLoop {
    private currentTick: number = 0;
    private lastTime: number = performance.now();
    private requestId: number | null = null;
    private tickInterval: number = -1;
    private updateFn: UpdateFn = noop;
    private animationRunner: AnimationRunner;

    constructor(animationRunner: AnimationRunner) {
        this.animationRunner = animationRunner;
    }

    public setTickInterval(tickInterval: number) {
        this.tickInterval = tickInterval;
        return this;
    }

    /**
     * Function that handles updating the engine ticks
     * This needs to be called when hosting a game,
     * this should not be called when joining a game
     */
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
        }

        this.lastTime = time - delta;

        this.requestId = requestAnimationFrame(this.gameLoop);
    };

    private startLoop() {
        if (this.requestId) return;
        this.lastTime = performance.now();
        this.requestId = requestAnimationFrame(this.gameLoop);
    }

    private pauseLoop() {
        if (!this.requestId) return;
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
    }

    public start() {
        this.currentTick = 0;
        console.log("starting game loop");
        if (this.requestId) return;
        this.startLoop();
    }

    public stop() {
        this.pauseLoop();
    }

    public isRunning() {
        return this.requestId !== null;
    }
}

class AnimationRunner {
    private animations: Map<UpdateFn, number> = new Map();
    private nextExecutionTicks: Map<UpdateFn, number> = new Map();

    /**
     * @param animation some fn that does animations manually
     * @param tickInterval how many game ticks should be between each animation tick
     */
    registerAnimation(animation: UpdateFn, tickInterval: number) {
        this.animations.set(animation, tickInterval);
    }

    unregisterAnimation(animation: UpdateFn) {
        this.animations.delete(animation);
    }

    runAnimations(currentTick: number) {
        for (const [animate, tickInterval] of this.animations.entries()) {
            if (currentTick >= (this.nextExecutionTicks.get(animate) ?? 0)) {
                animate(currentTick);
                this.nextExecutionTicks.set(animate, currentTick + tickInterval);
            }
        }
    }
}

export const animationRunner = new AnimationRunner();
export const gameLoop = new GameLoop(animationRunner).setTickInterval(10);
