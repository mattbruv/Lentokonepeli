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

    constructor() {
        this.container = new PIXI.Container();
        this.hillSprite = new PIXI.Sprite(Textures["hill1.gif"]);

        this.container.addChild(this.hillSprite);
        this.hillSprite.anchor.set(0.5, 0);

        this.container.zIndex = DrawLayer.Hill;
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    private getTexture() {
        return this.props.terrain === "Desert" ? Textures["sandhill.gif"] : Textures["hill1.gif"];
    }

    public setPosition(paramInt1: number, paramInt2: number) {
        return;

        paramInt1 = this.props.client_x - paramInt1;
        paramInt2 = this.props.client_y - paramInt2;

        paramInt1 = (paramInt1 * 8) / 10;
        paramInt2 = (paramInt2 * 9) / 10;
        this.hillSprite.position.set(-paramInt1 + paramInt1 - this.getTexture().width / 2, -paramInt2);

        /*
    const tex = this.hillSprite.texture;
    const { width } = tex
    const { client_x, client_y } = this.props

    console.log(width)

    const p1 = paramInt1 * 8 / 10;
    const p2 = paramInt2 * 9 / 10;

    const x1 = client_x + p1 - width / 2
    const y1 = client_y + p2

    this.hillSprite.position.set(x1, y1)
    */
    }

    public updateCallbacks: EntityUpdateCallbacks<HillProperties> = {
        terrain: () => {
            this.hillSprite.texture =
                this.props.terrain === "Normal" ? Textures["hill1.gif"] : Textures["sandhill.gif"];
        },
        client_x: () => {
            this.hillSprite.position.x = this.props.client_x;
        },
        client_y: () => {
            this.hillSprite.position.y = this.props.client_y;
        },
    };

    public destroy() {}
}
