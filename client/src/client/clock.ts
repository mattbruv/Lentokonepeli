import * as PIXI from "pixi.js";

const CLOCK_REFRESH_RATE_MS = 250;

export class Clock {
    public container: PIXI.Container;

    private clockText: PIXI.Text;
    private currentTimeMs: number = 0;
    private totalTimeMs: number = 0;
    // private panel: PIXI.Sprite;
    // private stats: PIXI.Graphics;
    // private bombs: PIXI.Container;
    // public radar: Radar;

    constructor() {
        this.container = new PIXI.Container();
        this.clockText = new PIXI.Text("", {
            fontFamily: "arial",
        });
        this.clockText.position.set(350, 397);
        this.container.addChild(this.clockText);

        // update clock text every second.
        window.setInterval(() => {
            this.currentTimeMs += CLOCK_REFRESH_RATE_MS;
            const totalSeconds = Math.floor(this.currentTimeMs / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            let str1 = minutes < 10 ? " " + minutes : minutes.toString();
            let str2 = seconds < 10 ? "0" + seconds : seconds.toString();

            if (minutes === 0 && seconds < 5) {
                // ctx.fillStyle = this.color2;
            } else {
                // ctx.fillStyle = this.color;
            }

            this.clockText.text = `${str1}:${str2}`;
        }, CLOCK_REFRESH_RATE_MS);
    }

    public setTotalTime(time: number) {
        this.totalTimeMs = time;
        console.log("RENDER total TIME", time);
    }

    public setCurrentTime(time: number) {
        this.currentTimeMs = time;
        console.log("RENDER TIME", time);
    }
}
