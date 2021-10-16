import * as PIXI from "pixi.js";

const GRID_WIDTH = 100;
const GRID_HEIGHT = 100;
const GRID_COLOR = 0x000000;
const GRID_OPACITY = 0.90;

/** The maximum distance in pixels to draw the x,y axis line */
const AXIS_BOUNDS = Math.pow(2, 16 - 1);

export class Grid {
    public container: PIXI.Container;
    public gridSprite: PIXI.TilingSprite;

    public constructor(renderer: PIXI.AbstractRenderer) {

        const graphics = new PIXI.Graphics();

        graphics.lineStyle(1, GRID_COLOR, 1);
        graphics.beginFill(0x000000, 0);
        graphics.drawRect(0, 0, GRID_HEIGHT, GRID_WIDTH);
        graphics.endFill();
        console.log(graphics.width, graphics.height)

        const renderTex = renderer.generateTexture(graphics);

        this.gridSprite = new PIXI.TilingSprite(renderTex);

        // Add to main container
        this.container = new PIXI.Container();
        this.container.addChild(this.gridSprite);
    }

    public setPos(x: number, y: number) {
        this.gridSprite.tilePosition.set(x, y);

    }

    public setSize(width: number, height: number) {
        this.gridSprite.width = width;
        this.gridSprite.height = height;
    }

}