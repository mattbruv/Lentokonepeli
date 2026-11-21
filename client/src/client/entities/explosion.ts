import { ExplosionProperties } from "dogfight-types/ExplosionProperties";
import * as PIXI from "pixi.js";
import { DrawLayer } from "../constants";
import { Textures } from "../textures";
import { Entity, EntityUpdateCallbacks } from "./entity";
import { soundManager } from "../soundManager";
import { drawQuality } from "../drawQuality";

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
    private lowQualityShape: PIXI.Graphics;

    public updateCallbacks: EntityUpdateCallbacks<ExplosionProperties> = {
        client_x: () => {
            this.bombSprite.position.x = this.props.client_x;
            this.drawLowQuality();
        },
        client_y: () => {
            this.bombSprite.position.y = this.props.client_y;
            this.drawLowQuality();
        },
        phase: () => {
            this.bombSprite.texture = Textures[PHASE_TEXTURES[this.props.phase]];
            this.drawLowQuality();
        },
        team: () => {},
    };

    constructor() {
        this.container = new PIXI.Container();

        const texture = Textures["explosion0001.gif"];
        this.bombSprite = new PIXI.Sprite(texture);

        this.lowQualityShape = new PIXI.Graphics();
        this.container.addChild(this.bombSprite);
        this.container.addChild(this.lowQualityShape);
        this.bombSprite.anchor.set(0.5);

        this.container.zIndex = DrawLayer.Explosion;

        soundManager.play("explosion");
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    private drawLowQuality() {
        this.bombSprite.visible = drawQuality.high;
        this.lowQualityShape.visible = !drawQuality.high;
        if (drawQuality.high) return;

        const first = Textures["explosion0001.gif"];
        const current = Textures[PHASE_TEXTURES[this.props.phase]];
        const left = this.props.client_x - Math.trunc(first.width / 2);
        const top = this.props.client_y - Math.trunc(first.height / 2);

        this.lowQualityShape.clear();
        this.lowQualityShape.beginFill(0xffffff);
        this.lowQualityShape.drawEllipse(
            left + current.width / 2,
            top + current.height / 2,
            current.width / 2,
            current.height / 2,
        );
        this.lowQualityShape.endFill();
    }

    public destroy() {}
}
