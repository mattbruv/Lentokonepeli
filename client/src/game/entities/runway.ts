import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { Direction, Entity } from "../entity";
import { getTexture } from "../resources";

export interface RunwayProps {
    x?: number;
    y?: number;
    team?: number;
    direction?: number;
}

export class Runway implements Entity {

    type = EntityType.RUNWAY;

    container = new PIXI.Container();

    sprite = new PIXI.Sprite(getTexture("runway.gif"));
    back = new PIXI.Sprite(getTexture("runway2b.gif"));

    constructor() {
        this.sprite.height = this.sprite.texture.height;
        this.back.visible = false;
        this.container.addChild(this.back);
        this.container.addChild(this.sprite);
    }

    destroy() { }

    update(props: RunwayProps) {
        console.log(props);
        if (props.x !== undefined) {
            this.sprite.position.x = props.x;
            this.back.x = props.x + 217;
        }
        if (props.y !== undefined) {
            this.sprite.position.y = props.y;
            this.back.y = props.y;
        }
        if (props.direction !== undefined) {
            if (props.direction == Direction.LEFT) {
                this.back.visible = true;
                this.sprite.texture = getTexture("runway2.gif")!;
            }
        }
    }

}