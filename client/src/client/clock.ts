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
            fontSize: 17,
            fill: "#afaf5a",
        });
        this.clockText.position.set(350, 397);
        this.container.addChild(this.clockText);

        // update clock text every second.
        window.setInterval(() => {
            this.currentTimeMs += CLOCK_REFRESH_RATE_MS;

            // Remaining time in milliseconds
            const remainingMs = Math.max(0, this.totalTimeMs - this.currentTimeMs);
            const totalSeconds = Math.floor(remainingMs / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            // Format strings
            const str1 = minutes < 10 ? " " + minutes : minutes.toString();
            const str2 = seconds < 10 ? "0" + seconds : seconds.toString();

            // Change color when under 5 seconds remaining
            this.clockText.style.fill = minutes === 0 && seconds < 5 ? "#ff8246" : "#afaf5a";

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
