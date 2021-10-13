import * as PIXI from "pixi.js";
import { EntityState } from "src/client";
import { EntityType } from "src/network/game/EntityType";
import { Background } from "./background";
import { Ground } from "./entities/ground";
import { World } from "./world";


export class GameClient {

    private app: PIXI.Application;

    private background = new Background();
    private world = new World();

    constructor() {
        this.app = new PIXI.Application();
        this.app.stage.addChild(this.background.container);
        this.app.stage.addChild(this.world.container);

        this.world.container.position.set(100, 100);
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