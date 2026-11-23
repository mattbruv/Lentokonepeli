import { DebugEntity } from "dogfight-types/DebugEntity";
import { Viewport } from "pixi-viewport";
import * as PIXI from "pixi.js";
import { collisionColor, TERRAIN_COLLISION_ALPHA } from "./collisionColors";
import { HUD_HEIGHT, SKY_COLOR, VIEW_HEIGHT, VIEW_WIDTH } from "./constants";
import { Entity } from "./entities/entity";

const SKY_Y = -500;
const MASK_BOUNDS_ALPHA = 0.4;
const TERRAIN_FILL_ALPHA = 0.25;
const INSPECT_HIGHLIGHT_COLOR = "#ffffff";

export class RenderClient {
    // https://pixijs.download/v7.x/docs/index.html
    public app: PIXI.Application<HTMLCanvasElement>;
    public viewport: Viewport;
    public background: PIXI.TilingSprite;
    public hud: PIXI.Container | null;

    public debugCollision = new PIXI.Graphics();
    public debugTerrain = new PIXI.Graphics();
    public inspectHighlight = new PIXI.Graphics();

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
            passiveWheel: false,
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

        if (enableMouseDragging) {
            this.viewport.drag().pinch().wheel().decelerate();
        }

        this.viewport.addChild(this.debugTerrain, this.debugCollision);
        this.debugTerrain.zIndex = 998;
        this.debugCollision.zIndex = 999;
        this.viewport.addChild(this.inspectHighlight);
        this.inspectHighlight.zIndex = 1000;
    }

    public enableCameraControls({
        minZoom,
        maxZoom,
        onPanStart,
        onViewChanged,
    }: {
        minZoom: number;
        maxZoom: number;
        onPanStart: () => void;
        onViewChanged: () => void;
    }) {
        this.viewport.drag().pinch().wheel().decelerate().clampZoom({ minScale: minZoom, maxScale: maxZoom });
        this.viewport.cursor = "grab";
        this.viewport.on("drag-start", onPanStart);
        this.viewport.on("pinch-start", onPanStart);
        this.viewport.on("moved", onViewChanged);
        this.viewport.on("zoomed", onViewChanged);
    }

    public onPointerHover(callback: (screen: PIXI.IPointData | null) => void) {
        this.viewport.on("pointermove", (event) => {
            const { x, y } = event.global;
            callback(y < this.getGameHeight() ? { x, y } : null);
        });
        this.app.view.addEventListener("pointerleave", () => callback(null));
    }

    public screenToWorld(point: PIXI.IPointData): PIXI.IPointData {
        return this.viewport.toWorld(point.x, point.y);
    }

    public getCanvasScale(): number {
        return this.app.view.clientWidth / this.app.screen.width || 1;
    }

    public highlight(boxes: { x: number; y: number; width: number; height: number }[]) {
        this.inspectHighlight.clear();
        if (!boxes.length) return;
        this.inspectHighlight.lineStyle({ color: INSPECT_HIGHLIGHT_COLOR, width: 1, alignment: 1 });
        for (const { x, y, width, height } of boxes) {
            this.inspectHighlight.drawRect(x, y, width, height);
        }
        this.inspectHighlight.lineStyle({ width: 0 });
    }

    public getZoom(): number {
        return this.viewport.scale.x;
    }

    public setZoom(zoom: number) {
        this.viewport.setZoom(zoom);
    }

    private getGameHeight(): number {
        return this.app.screen.height - (this.hud ? HUD_HEIGHT : 0);
    }

    public getViewCenter(): PIXI.IPointData {
        return this.viewport.toWorld(this.app.screen.width / 2, this.getGameHeight() / 2);
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

    public cameraOffsetX = 0;
    public cameraOffsetY = 0;

    public positionRelativeGameObjects(x: number, y: number) {
        const gameHeight = this.getGameHeight();
        this.cameraOffsetX = Math.trunc(this.app.screen.width / 2) - Math.round(x);
        this.cameraOffsetY = Math.trunc(gameHeight / 2) - Math.round(y);

        this.background.width = this.app.screen.width;
        this.background.height = this.background.texture.height;
        this.background.tilePosition.set(Math.trunc(this.cameraOffsetX / 6), 0);
        this.background.position.set(0, SKY_Y + Math.trunc(this.cameraOffsetY / 3));
    }

    /**
     * Center the camera view on a specific (x, y) location
     * Coordinates must be in game world space.
     */
    public centerCamera(x: number, y: number): void {
        const scale = this.getZoom();
        const x1 = x - this.app.screen.width / 2 / scale;
        const y1 = y - this.getGameHeight() / 2 / scale;

        this.viewport.moveCorner(x1, y1);
        this.positionRelativeGameObjects(x, y);
    }

    public renderDebug(debugInfo: DebugEntity[]) {
        this.drawDebug(this.debugCollision, debugInfo);
    }

    public clearDebug() {
        this.debugTerrain.clear();
        this.debugCollision.clear();
    }

    public renderDebugTerrain(debugInfo: DebugEntity[]) {
        this.drawDebug(this.debugTerrain, debugInfo, TERRAIN_COLLISION_ALPHA);
    }

    private drawDebug(graphics: PIXI.Graphics, debugInfo: DebugEntity[], alpha = 1) {
        graphics.clear();
        this.viewport.sortChildren();

        for (const entry of debugInfo) {
            const color = collisionColor(entry);
            const { x, y, width, height } = entry.bounding_box;
            const type = entry.ent_type.type;

            if (entry.pixels) {
                graphics.lineStyle({ color, width: 1, alpha: alpha * MASK_BOUNDS_ALPHA, alignment: 0 });
                graphics.drawRect(x, y, width, height);
                graphics.lineStyle({ width: 0 });
                graphics.beginFill(color, alpha);
                for (const pixel of entry.pixels) {
                    graphics.drawRect(x + pixel.x, y + pixel.y, 1, 1);
                }
                graphics.endFill();
                continue;
            }

            graphics.lineStyle({ color, width: 1, alpha, alignment: 0 });

            if (type === "Runway") {
                graphics.drawRect(x, y, width, height);
                continue;
            }

            const fillAlpha = type === "Ground" || type === "Water" ? alpha * TERRAIN_FILL_ALPHA : alpha;
            graphics.beginFill(color, fillAlpha);
            graphics.drawRect(x, y, width, height);
            graphics.endFill();
        }

        graphics.lineStyle({ width: 0 });
    }
}
