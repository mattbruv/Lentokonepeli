import { DebugEntity } from "dogfight-types/DebugEntity";
import { EntityType } from "dogfight-types/EntityType";
import { Viewport } from "pixi-viewport";
import * as PIXI from "pixi.js";
import { SKY_COLOR, VIEW_HEIGHT, VIEW_WIDTH } from "./constants";
import { Entity } from "./entities/entity";

export class RenderClient {
    // https://pixijs.download/v7.x/docs/index.html
    public app: PIXI.Application<HTMLCanvasElement>;
    public viewport: Viewport;
    public background: PIXI.TilingSprite;
    public hud: PIXI.Container | null;

    // Debugging helpers
    public debugPointer = new PIXI.Text();
    public debugCoords = new PIXI.Text();
    public debugCollision = new PIXI.Graphics();
    public debug = new PIXI.Graphics();

    constructor({
        background,
        containers,
        hud,
        enableMouseDragging,
    }: {
        hud: PIXI.Container | null;
        background: PIXI.TilingSprite;
        containers: PIXI.DisplayObject[];
        enableMouseDragging?: boolean;
    }) {
        this.app = new PIXI.Application<HTMLCanvasElement>({
            antialias: false,
            resolution: 1,
            backgroundColor: SKY_COLOR,
            width: VIEW_WIDTH,
            height: VIEW_HEIGHT,
        });

        this.background = background;

        this.app.stage.addChild(background);

        this.viewport = new Viewport({
            events: this.app.renderer.events,
        });
        this.app.stage.addChild(this.viewport);

        this.hud = hud;

        if (hud) {
            this.app.stage.addChild(hud);
        }

        if (containers.length) {
            this.app.stage.addChild(...containers);
        }

        this.viewport.sortableChildren = true;

        if (enableMouseDragging || import.meta.env.DEV) {
            this.viewport.drag().pinch().wheel().decelerate();
        }

        if (import.meta.env.DEV) {
            this.app.stage.addChild(this.debugPointer);
            this.app.stage.addChild(this.debugCoords);
            this.viewport.addChild(this.debugCollision);
            this.debugCollision.zIndex = 999;
            this.debugCoords.position.set(0, 30);
            this.debugPointer.style.fontFamily = "monospace";
            this.debugCoords.style.fontFamily = "monospace";

            this.viewport.onpointermove = (e) => {
                const pos = this.viewport.toWorld(e.data.global);
                const x = Math.round(pos.x);
                const y = Math.round(pos.y);
                this.debugPointer.text = `${x}, ${y}`;
            };

            window.setTimeout(() => {
                this.viewport.addChild(this.debug);
            }, 100);
        }
    }

    public addEntity(entity: Entity<unknown>) {
        const container = entity.getContainer();
        const containers = Array.isArray(container) ? container : [container];
        this.viewport.addChild(...containers);
    }

    public removeEntity(entity: Entity<unknown>) {
        const container = entity.getContainer();
        const containers = Array.isArray(container) ? container : [container];
        this.viewport.removeChild(...containers);
    }

    private positionRelativeGameObjects(x: number, y: number) {
        const x1 = x / 6;
        const y1 = y / 3 + 125;

        // reposition sky
        this.background.tilePosition.set(-x1, -y1);

        // TODO handle parallax for hills and stuff
    }

    /**
     * Center the camera view on a specific (x, y) location
     * Coordinates must be in game world space.
     */
    public centerCamera(x: number, y: number): void {
        const x1 = x - this.app.screen.width / 2;
        const y1 = y - (this.app.screen.height - (this.hud?.height ?? 0)) / 2;

        this.viewport.moveCorner(x1, y1);
        this.positionRelativeGameObjects(x, y);
    }

    public renderDebug(debugInfo: DebugEntity[]) {
        this.debugCollision.clear();
        this.viewport.sortChildren();

        for (const entry of debugInfo) {
            this.debugCollision.lineStyle({
                color: DEBUG_COLORS[entry.ent_type.type],
                width: 1,
            });

            if (entry.ent_type.type === "Runway" && !entry.pixels) {
                this.debugCollision.lineStyle({
                    color: "magenta",
                    width: 1,
                });
            }

            const { x, y, width, height } = entry.bounding_box;

            // console.log(entry)

            this.debugCollision.drawRect(x, y, width, height);

            if (entry.pixels) {
                for (const pixel of entry.pixels) {
                    const px = x + pixel.x;
                    const py = y + pixel.y;
                    this.debugCollision.drawRect(px, py, 1, 1);
                }
            }
        }

        this.debugCollision.endFill();
    }
}

const DEBUG_COLORS: Record<EntityType, string> = {
    WorldInfo: "gray",
    Man: "magenta",
    Plane: "red",
    Player: "gray",
    BackgroundItem: "",
    Ground: "orange",
    Coast: "peru",
    Runway: "purple",
    Water: "blue",
    Bunker: "brown",
    Bomb: "black",
    Explosion: "lime",
    Hill: "green",
    Bullet: "pink",
};
