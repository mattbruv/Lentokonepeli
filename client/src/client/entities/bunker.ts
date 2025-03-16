import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { DrawLayer } from "../constants";
import { BunkerProperties } from "dogfight-types/BunkerProperties";
import { Team } from "dogfight-types/Team";

export class Bunker implements Entity<BunkerProperties> {
    public props: Required<BunkerProperties> = {
        team: "Allies",
        x: 0,
        y: 0,
    };

    private container: PIXI.Container;
    private bunker: PIXI.Sprite;

    constructor() {
        this.container = new PIXI.Container();
        this.bunker = new PIXI.Sprite();

        this.container.addChild(this.bunker);

        this.container.zIndex = DrawLayer.Bunker;
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public updateCallbacks: EntityUpdateCallbacks<BunkerProperties> = {
        team: () => {
            if (this.props.team !== undefined) {
                const textures: Record<Team, PIXI.Texture> = {
                    Centrals: Textures["headquarter_germans.gif"],
                    Allies: Textures["headquarter_raf.gif"],
                };

                this.bunker.texture = textures[this.props.team];
            }
        },
        x: () => {
            if (this.props.x !== undefined) {
                this.bunker.position.x = this.props.x;
            }
        },
        y: () => {
            if (this.props.y !== undefined) {
                this.bunker.position.y = this.props.y;
            }
        },
    };

    public updateProps(props: BunkerProperties): void {}

    public destroy() {}
}
