import { ExplosionProperties } from "dogfight-types/ExplosionProperties";
import * as PIXI from "pixi.js";
import { DrawLayer } from "../constants";
import { Textures } from "../textures";
import { Entity, EntityUpdateCallbacks } from "./entity";
import { soundManager } from "../soundManager";

const PHASE_TEXTURES: Record<number, keyof typeof Textures> = {
    0: "explosion0001.gif",
    1: "explosion0002.gif",
    2: "explosion0003.gif",
    3: "explosion0004.gif",
    4: "explosion0005.gif",
    5: "explosion0006.gif",
    6: "explosion0007.gif",
    7: "explosion0008.gif",
    8: "explosion0008.gif",
};

export class Explosion implements Entity<ExplosionProperties> {
    public props: Required<ExplosionProperties> = {
        client_x: 0,
        client_y: 0,
        phase: 0,
        team: null,
    };

    private container: PIXI.Container;
    private bombSprite: PIXI.Sprite;

    public updateCallbacks: EntityUpdateCallbacks<ExplosionProperties> = {
        client_x: () => {
            this.bombSprite.position.x = this.props.client_x;
            //console.log(this.props.client_x);
        },
        client_y: () => {
            this.bombSprite.position.y = this.props.client_y;
            //console.log(this.props.client_y);
        },
        phase: () => {
            this.bombSprite.texture = Textures[PHASE_TEXTURES[this.props.phase]];
            //console.log("PHASE: ", this.props.phase);
        },
        team: () => {},
    };

    constructor() {
        this.container = new PIXI.Container();

        const texture = Textures["explosion0001.gif"];
        this.bombSprite = new PIXI.Sprite(texture);

        this.container.addChild(this.bombSprite);
        this.bombSprite.anchor.set(0.5);

        this.container.zIndex = DrawLayer.Bomb;

        soundManager.playSound(
            new Howl({
                src: "audio/explosion.mp3",
            }),
        );
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public destroy() {}
}
