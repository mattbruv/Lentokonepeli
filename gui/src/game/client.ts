import * as PIXI from "pixi.js";
import { World } from "./world";


export class GameClient {

    private app: PIXI.Application;
    private world = new World();

    constructor() {
        this.app = new PIXI.Application();
        this.app.stage.addChild(this.world.container);
    }

    private appendCanvas(element: string) {
        const el = document.querySelector(element);
        if (el) {
            el.appendChild(this.app.view);
        }
    }

    initialize(resourceURL: string, element: string) {
        if (!PIXI.Loader.shared.resources[resourceURL]) {
            console.log("requesting game resources...");
            PIXI.Loader.shared.add(resourceURL).load(() => {
                this.appendCanvas(element);
            })
        }
        else {
            this.appendCanvas(element);
        }
    }
}