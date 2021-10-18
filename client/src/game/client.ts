import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

import { EntityState, readBinaryPacket } from "../client";
import { EntityType } from "src/network/game/EntityType";
import { Background } from "./background";
import { Ground } from "./entities/ground";
import { World } from "./world";
import { Grid } from "./grid";
import { SocketConnection } from "../network/socket";

let conn: SocketConnection;

export class GameClient {

    private app: PIXI.Application;
    private viewport: Viewport;
    private grid: Grid;

    private background = new Background();
    private world = new World();

    constructor() {

        this.app = new PIXI.Application({
            antialias: false
        });

        this.grid = new Grid(this.app.renderer);

        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

        this.viewport = new Viewport({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            worldWidth: 1000,
            worldHeight: 1000,

            interaction: this.app.renderer.plugins.interaction
        });

        this.viewport.drag().pinch().wheel().clampZoom({
            minWidth: 100,
            maxWidth: 3000,
        });

        this.app.stage.addChild(this.background.container);
        this.app.stage.addChild(this.viewport);
        this.viewport.addChild(this.world.container);
        this.app.stage.addChild(this.grid.container);

        this.viewport.addListener("moved", (event) => { this.updateGrid(event); });

        this.grid.setSize(this.app.view.width, this.app.view.height);
    }

    public disconnect() {
        if (conn) {
            conn.socket.close();
        }
    }

    public connect(url: string, onConnect: () => void) {

        conn = new SocketConnection(url);

        conn.socket.onopen = (ev) => {
            console.log("Connected to " + url);
            onConnect();
        }

        conn.socket.onmessage = (ev) => {
            let data;
            if (ev.data instanceof ArrayBuffer) {
                data = readBinaryPacket(ev.data);
                this.applyGameState(data);
            }
            else {
                data = JSON.parse(ev.data);
            }
        }
    }

    private updateGrid(event: any) {
        const view = event.viewport;
        const box = view.hitArea;
        //console.log(view)
        this.grid.setScale(event.viewport.scale);
        const height = view.screenHeightInWorldPixels;
        const width = view.screenWidthInWorldPixels;
        this.grid.setSize(width, height);
        this.grid.setPos(-view.left, -view.top);
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