import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { Direction, Entity } from "../entity";
import { getTexture } from "../resources";

export interface CoastProps {
    x?: number;
    y?: number;
    type?: number;
    direction?: number;
}

export class Coast implements Entity {

    type = EntityType.COAST;

    sprite = new PIXI.Sprite(getTexture("beach-l.gif")!);

    constructor() {
        this.sprite.height = this.sprite.texture.height;
    }

    destroy() { }

    update(props: CoastProps) {
        console.log(props);
        if (props.x) {
            this.sprite.position.x = props.x;
        }
        if (props.y) {
            this.sprite.position.y = props.y;
        }
        if (props.direction) {
            console.log("CHANGE DIRECTION", props.direction)
            if (props.direction == Direction.RIGHT) {
                this.sprite.anchor.x = 1;
                this.sprite.scale.x *= -1;
            }
        }
        if (props.type) {
            console.log("change coast type!");
        }
    }

}