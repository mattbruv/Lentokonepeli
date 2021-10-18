import * as PIXI from "pixi.js";

const GRID_WIDTH = 100;
const GRID_HEIGHT = 100;
const GRID_COLOR = 0x000000;
const GRID_OPACITY = 0.35;

/** The maximum distance in pixels to draw the x,y axis line */
const AXIS_BOUNDS = Math.pow(2, 16 - 1);

export class Grid {
    public container: PIXI.Container;
    private gridSprite: PIXI.TilingSprite;

    /*
    Note: Renderer needs to be passed to constructor
    in order to function properly.
    calling PIXI.autoDetectRenderer() doesn't work.
    */
    public constructor(renderer: PIXI.AbstractRenderer) {

        const graphics = new PIXI.Graphics();

        graphics.lineStyle(1, GRID_COLOR, GRID_OPACITY);
        graphics.beginFill(GRID_COLOR, 0);
        graphics.drawRect(0, 0, GRID_HEIGHT, GRID_WIDTH);
        graphics.endFill();

        const renderTex = renderer.generateTexture(graphics);
        this.gridSprite = new PIXI.TilingSprite(renderTex);

        // Add to main container
        this.container = new PIXI.Container();
        this.container.addChild(this.gridSprite);
    }

    public setPos(x: number, y: number) {
        //console.log("pos: ", x, y)
        this.gridSprite.tilePosition.set(x, y);
    }

    public setScale(scale: PIXI.ObservablePoint) {
        //console.log("scale: ", scale.x, scale.y)
        this.gridSprite.scale = scale;
        // this.gridSprite.tileScale = scale;
    }

    public setSize(width: number, height: number) {
        //console.log("size: ", width, height);
        this.gridSprite.width = width;
        this.gridSprite.height = height;
    }
}