import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { DrawLayer } from "../constants";
import { HillProperties } from "dogfight-types/HillProperties";
import { Textures } from "../textures";

export class Hill implements Entity<HillProperties> {
    props: Required<HillProperties> = {
        terrain: "Normal",
        client_x: 0,
        client_y: 0,
    };

    private container: PIXI.Container;
    private hillSprite: PIXI.Sprite;
    private cameraOffsetX = 0;
    private cameraOffsetY = 0;

    constructor() {
        this.container = new PIXI.Container();
        this.hillSprite = new PIXI.Sprite(Textures["hill1.gif"]);

        this.container.addChild(this.hillSprite);

        this.container.zIndex = DrawLayer.Hill;
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    private getTexture() {
        return this.props.terrain === "Desert" ? Textures["sandhill.gif"] : Textures["hill1.gif"];
    }

    public setVisible(visible: boolean) {
        this.container.visible = visible;
    }

    public setCameraOffset(offsetX: number, offsetY: number) {
        this.cameraOffsetX = offsetX;
        this.cameraOffsetY = offsetY;
        this.updatePosition();
    }

    private updatePosition() {
        const parallaxX = Math.trunc((this.cameraOffsetX * 8) / 10);
        const parallaxY = Math.trunc((this.cameraOffsetY * 9) / 10);
        const x = this.props.client_x + parallaxX - Math.floor(this.getTexture().width / 2) - this.cameraOffsetX;
        const y = this.props.client_y + parallaxY - this.cameraOffsetY;
        this.hillSprite.position.set(x, y);
    }

    public updateCallbacks: EntityUpdateCallbacks<HillProperties> = {
        terrain: () => {
            this.hillSprite.texture = this.getTexture();
            this.updatePosition();
        },
        client_x: () => this.updatePosition(),
        client_y: () => this.updatePosition(),
    };

    public destroy() {}
}
