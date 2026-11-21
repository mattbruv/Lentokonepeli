import { BombProperties } from "dogfight-types/BombProperties";
import * as PIXI from "pixi.js";
import { DrawLayer } from "../constants";
import { directionToRadians } from "../helpers";
import { Textures } from "../textures";
import { Entity, EntityUpdateCallbacks } from "./entity";
import { soundManager } from "../soundManager";

const BOMB_IMAGE_DIRECTIONS = 64;

export class Bomb implements Entity<BombProperties> {
    private container: PIXI.Container;
    private rotator: PIXI.Container;
    private bombSprite: PIXI.Sprite;

    public props: Required<BombProperties> = {
        client_x: 0,
        client_y: 0,
        direction: 0,
    };

    constructor() {
        this.container = new PIXI.Container();
        const texture = Textures["bomb.gif"];
        const size = Math.ceil(Math.sqrt(texture.width * texture.width + texture.height * texture.height));
        this.bombSprite = new PIXI.Sprite(texture);
        this.bombSprite.position.set(Math.floor((size - texture.width) / 2), Math.floor((size - texture.height) / 2));
        this.rotator = new PIXI.Container();
        this.rotator.pivot.set(size / 2, size / 2);
        this.rotator.position.set(size / 2, size / 2);
        this.rotator.addChild(this.bombSprite);
        this.container.addChild(this.rotator);
        this.container.zIndex = DrawLayer.Bomb;

        soundManager.play("bombdrop");
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public updateCallbacks: EntityUpdateCallbacks<BombProperties> = {
        client_x: () => {
            this.container.position.x = this.props.client_x;
            //console.log("BOMB X: " + this.props.client_x)
        },
        client_y: () => {
            this.container.position.y = this.props.client_y;
            //console.log("BOMB y: " + this.props.client_y)
        },
        direction: () => {
            // console.log(this.props.direction)
            const step = Math.floor((this.props.direction * BOMB_IMAGE_DIRECTIONS) / 256);
            this.rotator.rotation = directionToRadians((step * 256) / BOMB_IMAGE_DIRECTIONS);
        },
    };

    public destroy() {}
}
