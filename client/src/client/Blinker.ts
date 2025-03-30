import * as PIXI from "pixi.js";
import { TaskFn, scheduler } from "../gameLoop";
import { soundManager } from "./soundManager";

export class Blinker {
    blinking = false;
    targets: PIXI.Sprite[];
    filter: PIXI.ColorMatrixFilter;
    hitSound = new Howl({ src: "audio/hit.mp3" });

    constructor(targets: PIXI.Sprite[]) {
        this.targets = targets;
        this.filter = new PIXI.ColorMatrixFilter();
        this.filter.matrix = getHealthBarMatrix();
    }

    private stopBlink: TaskFn = () => {
        this.blinking = false;
        for (const target of this.targets) {
            target.filters = null;
        }
    };

    public tryBlink() {
        if (this.blinking) return;
        this.blinking = true;
        soundManager.playSound(this.hitSound);
        for (const target of this.targets) {
            target.filters = [this.filter];
        }
        scheduler.scheduleTask(this.stopBlink, 10);
    }
}

export const getHealthBarMatrix = (): PIXI.ColorMatrix => [
    1,
    0,
    0,
    0,
    255, // Red
    0,
    1,
    0,
    0,
    255, // Green
    0,
    0,
    1,
    0,
    255, // Blue
    0,
    0,
    0,
    1,
    0, // Alpha
];
