export type TaskFn = (currentTick: number) => void;
const noop = () => {};

/**
 * When facing a case where useInterval or short setTimeout seems handy, use this GameLoop instead
 */
class GameLoop {
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
        let delta = time - this.lastTime;

        while (delta >= this.tickInterval) {
            this.currentTick++;
            this.engineUpdateFn(this.currentTick);
            this.scheduler.runTasks(this.currentTick);
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
     * Unregister both recurring or one time tasks from bein run
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
