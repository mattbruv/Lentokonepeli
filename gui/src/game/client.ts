import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

import { EntityState } from "src/client";
import { EntityType } from "src/network/game/EntityType";
import { Background } from "./background";
import { Ground } from "./entities/ground";
import { World } from "./world";
import { Grid } from "./grid";


export class GameClient {

    private app: PIXI.Application;
    private viewport: Viewport;
    private grid: Grid;

    private background = new Background();
    private world = new World();

    constructor() {
        this.app = new PIXI.Application();
        this.grid = new Grid(this.app.renderer);

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
        // this.viewport.addChild(this.grid.container);
        this.app.stage.addChild(this.grid.container);

        // debug center point
        const g = new PIXI.Graphics();
        g.beginFill();
        g.drawCircle(0, 0, 5);
        g.endFill();
        this.world.container.addChild(g)

        this.viewport.addListener("moved", (event) => {
            const box = event.viewport.hitArea;
            console.log(box);
            this.grid.setPos(-box.x, -box.y);
        });

        this.grid.setSize(this.app.view.width, this.app.view.height);
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