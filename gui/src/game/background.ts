import * as PIXI from "pixi.js";
import { Sky } from "./entities/sky";

export class Background {

    container = new PIXI.Container();
    sky = new Sky();

    constructor() {
        this.container.addChild(this.sky.sprite);
    }
}