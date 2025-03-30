export type AnimationFn = (currentTick: number) => void;
const noop = () => {};

/**
 * When facing a case where useInterval or short setTimeout seems handy, use this GameLoop instead
 */
class GameLoop {
    private currentTick: number = 0;
    private lastTime: number = performance.now();
    private requestId: number | null = null;
    private tickInterval: number = -1;
    private updateFn: AnimationFn = noop;
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
    public setHostEngineUpdateFn(updateFn: AnimationFn) {
        this.updateFn = updateFn;
        return this;
    }

    private gameLoop = (time: number) => {
        let delta = time - this.lastTime;

        while (delta >= this.tickInterval) {
            this.currentTick++;
            this.updateFn(this.currentTick);
            this.animationRunner.runAnimations(this.currentTick);
            delta -= this.tickInterval;
        }

        this.lastTime = time - delta;
        this.requestId = requestAnimationFrame(this.gameLoop);
    };

    public start() {
        if (this.requestId) return;
        this.currentTick = 0;
        this.lastTime = performance.now();
        this.requestId = requestAnimationFrame(this.gameLoop);
    }

    public stop() {
        if (!this.requestId) return;
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
    }

    public isRunning() {
        return this.requestId !== null;
    }
}

class AnimationRunner {
    private animations: Map<AnimationFn, number> = new Map();
    private oneTimeAnimations: Map<AnimationFn, number> = new Map();
    private nextExecutionTicks: Map<AnimationFn, number> = new Map();
    private oneTimeAnimationQueue: Array<[AnimationFn, number]> = [];

    /**
     * @param animation some fn that does animations manually
     * @param tickInterval how many game ticks should be between each animation tick
     */
    registerAnimation(animation: AnimationFn, tickInterval: number) {
        this.animations.set(animation, tickInterval);
    }

    /**
     * Animation that should be run once
     */
    scheduleOneTimeAnimation(animation: AnimationFn, ticksUntil: number) {
        this.oneTimeAnimationQueue.push([animation, ticksUntil]);
    }

    unregisterAnimation(animation: AnimationFn) {
        this.animations.delete(animation);
        this.oneTimeAnimations.delete(animation);
    }

    runAnimations(currentTick: number) {
        for (const [animate, tickInterval] of this.animations.entries()) {
            if (currentTick >= (this.nextExecutionTicks.get(animate) ?? 0)) {
                animate(currentTick);
                this.nextExecutionTicks.set(animate, currentTick + tickInterval);
            }
        }

        for (const [animation, ticksUntil] of this.oneTimeAnimationQueue) {
            this.oneTimeAnimations.set(animation, ticksUntil + currentTick);
        }
        this.oneTimeAnimationQueue.length = 0;

        for (const [animate, onTick] of this.oneTimeAnimations.entries()) {
            if (currentTick >= onTick) {
                this.oneTimeAnimations.delete(animate);
                animate(currentTick);
            }
        }
    }
}

export const animationRunner = new AnimationRunner();
export const gameLoop = new GameLoop(animationRunner).setTickInterval(10);
