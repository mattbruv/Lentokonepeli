import * as PIXI from "pixi.js";
import { Grid } from "./grid";

export class Debug {
    public container: PIXI.Container;
    public grid: Grid;
    private coords = new PIXI.Text("");

    constructor(renderer: PIXI.AbstractRenderer) {
        this.container = new PIXI.Container();
        this.grid = new Grid(renderer);
        this.coords.position.set(5, 5);
        this.container.addChild(this.coords);
    }

    setCoords(_x: number, _y: number) {
        const x = Math.floor(_x);
        const y = -Math.floor(_y);
        this.coords.text = "(" + x + ", " + y + ")";
    }
}