import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

import { EntityState } from "src/client";
import { EntityType } from "src/network/game/EntityType";
import { Background } from "./background";
import { Ground } from "./entities/ground";
import { World } from "./world";


export class GameClient {

    private app: PIXI.Application;
    private viewport: Viewport;

    private background = new Background();
    private world = new World();

    constructor() {
        this.app = new PIXI.Application();

        this.viewport = new Viewport({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            worldWidth: 1000,
            worldHeight: 1000,

            interaction: this.app.renderer.plugins.interaction
        });

        this.viewport.drag().pinch().wheel(); //.decelerate();

        this.app.stage.addChild(this.background.container);
        this.app.stage.addChild(this.viewport);
        this.viewport.addChild(this.world.container);
    }

    public appendCanvas(element: string) {
        const el = document.querySelector(element);
        if (el) {
            el.appendChild(this.app.view);
        }
    }

    public applyGameState(state: EntityState[]) {
        for (const s of state) {
            const id = s.id;
            const type = s.type;

            switch (type) {
                case EntityType.GROUND: {
                    const g = new Ground();
                    g.update(s.data);
                    this.world.container.addChild(g.sprite);
                }
            }
        }
    }

}