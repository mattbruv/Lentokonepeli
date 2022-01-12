import * as PIXI from "pixi.js";

export class World {

    container = new PIXI.Container();

    constructor() {
        this.container.sortableChildren = true;
    }

}