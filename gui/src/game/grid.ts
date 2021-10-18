import * as PIXI from "pixi.js";


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

        graphics.lineStyle(1, 0x555555, 1);
        graphics.beginFill(0x000000, 0);

        for (let i = 0; i < 10; i++) {
            graphics.moveTo(0, i * 100);
            graphics.lineTo(1000, i * 100);
            graphics.moveTo(i * 100, 0);
            graphics.lineTo(i * 100, 1000);
        }

        graphics.lineStyle(1, 0xff0000, 1);
        graphics.moveTo(0, 0);
        graphics.lineTo(0, 1000);

        graphics.lineStyle(1, 0x0000ff, 1);
        graphics.moveTo(500, 0);
        graphics.lineTo(500, 1000);
        graphics.moveTo(0, 500);
        graphics.lineTo(1000, 500);

        graphics.lineStyle(1, 0x00ff00, 1);
        graphics.moveTo(0, 0);
        graphics.lineTo(1000, 0);

        // graphics.drawRect(0, 0, 100, 100);
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