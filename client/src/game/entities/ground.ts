import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { Entity } from "../entity";
import { getTexture } from "../resources";

export interface GroundProps {
    x?: number;
    y?: number;
    width?: number;
    type?: number;
}

export class Ground implements Entity {

    type = EntityType.GROUND;

    sprite = new PIXI.TilingSprite(getTexture("ground1.gif")!);

    constructor() {
        this.sprite.height = this.sprite.texture.height;
    }

    destroy() { }

    update(props: GroundProps) {
        if (props.x) {
            this.sprite.position.x = props.x;
        }
        if (props.y) {
            this.sprite.position.y = props.y;
        }
        if (props.width) {
            this.sprite.width = props.width;
        }
        if (props.type) {
            console.log("change ground type!");
        }
    }

}