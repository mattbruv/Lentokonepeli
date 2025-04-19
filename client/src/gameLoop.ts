export type TaskFn = (currentTick: number) => void;
export const noop = () => {};

/**
 * When facing a case where useInterval or short setTimeout seems handy, use this GameLoop instead
 */
class GameLoop {
    private paused: boolean = false;
    private advanceTick: boolean = false;
    private currentTick: number = 0;
    private lastTime: number = performance.now();
    private requestId: number | null = null;
    private tickInterval: number = -1;
    private engineUpdateFn: TaskFn = noop;
    private scheduler: Scheduler;

    constructor(scheduler: Scheduler) {
        this.scheduler = scheduler;
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
    public setHostEngineUpdateFn(updateFn: TaskFn) {
        this.engineUpdateFn = updateFn;
        return this;
    }

    private gameLoop = (time: number) => {
        const doTick = () => {
            this.currentTick++;
            this.engineUpdateFn(this.currentTick);
            this.scheduler.runTasks(this.currentTick);
        };

        if (this.advanceTick) {
            doTick();
            this.advanceTick = false;
        }

        if (!this.paused) {
            let delta = time - this.lastTime;
            while (delta >= this.tickInterval) {
                doTick();
                delta -= this.tickInterval;
            }

            this.lastTime = time - delta;
        }

        if (this.requestId)
            // Only request the next animation frame if we haven't called stop(),
            // which sets requestId to null
            this.requestId = requestAnimationFrame(this.gameLoop);
    };

    public start(currentTick: number = 0) {
        if (this.requestId) return;
        this.currentTick = currentTick;
        this.lastTime = performance.now();
        this.requestId = requestAnimationFrame(this.gameLoop);
    }

    public setPaused(paused: boolean) {
        console.log("AGME LOOP SET PAUSED", paused);
        this.paused = paused;
        if (!paused) {
            this.lastTime = performance.now();
        }
    }

    public stop() {
        if (!this.requestId) return;
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
    }

    public isRunning() {
        return this.requestId !== null;
    }

    public advanceOneTick() {
        this.advanceTick = true;
        this.lastTime = performance.now();
    }
}

class Scheduler {
    private recurringTasks: Map<TaskFn, number> = new Map();
    private oneTimeTasks: Map<TaskFn, number> = new Map();
    private nextExecutionTicks: Map<TaskFn, number> = new Map();
    private oneTimeTasksQueue: Array<[TaskFn, number]> = [];

    /**
     * @param task some fn that performs tasks (for example animations)
     * @param tickInterval how many game ticks should be between each task call
     */
    scheduleRecurring(task: TaskFn, tickInterval: number) {
        this.recurringTasks.set(task, tickInterval);
    }

    /**
     * Schedules a task that should be run once
     */
    scheduleTask(task: TaskFn, ticksUntil: number) {
        this.oneTimeTasksQueue.push([task, ticksUntil]);
    }

    /**
     * Unregister both recurring or one time tasks from being run
     */
    unregister(task: TaskFn) {
        this.recurringTasks.delete(task);
        this.oneTimeTasks.delete(task);
    }

    runTasks(currentTick: number) {
        for (const [task, tickInterval] of this.recurringTasks.entries()) {
            if (currentTick >= (this.nextExecutionTicks.get(task) ?? 0)) {
                task(currentTick);
                this.nextExecutionTicks.set(task, currentTick + tickInterval);
            }
        }

        for (const [task, ticksUntil] of this.oneTimeTasksQueue) {
            this.oneTimeTasks.set(task, ticksUntil + currentTick);
        }
        this.oneTimeTasksQueue.length = 0;

        for (const [task, onTick] of this.oneTimeTasks.entries()) {
            if (currentTick >= onTick) {
                this.oneTimeTasks.delete(task);
                task(currentTick);
            }
        }
    }
}

export const scheduler = new Scheduler();
export const gameLoop = new GameLoop(scheduler).setTickInterval(10);
