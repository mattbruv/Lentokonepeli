import * as PIXI from "pixi.js";
import { Background } from "./background";
import { World } from "./world";


export class GameClient {

    private app: PIXI.Application;

    private background = new Background();
    private world = new World();

    constructor() {
        this.app = new PIXI.Application();
        this.app.stage.addChild(this.background.container);
        this.app.stage.addChild(this.world.container);
    }

    public appendCanvas(element: string) {
        const el = document.querySelector(element);
        if (el) {
            el.appendChild(this.app.view);
        }
    }

}