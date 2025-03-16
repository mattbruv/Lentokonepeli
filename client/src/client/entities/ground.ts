import { GroundProperties } from "dogfight-types/GroundProperties";
import { Entity, EntityUpdateCallbacks, RadarEnabled } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { DrawLayer, TERRAIN_WATER_COLOR } from "../constants";
import { Terrain } from "dogfight-types/Terrain";
import { RadarObject, RadarObjectType } from "../radar";

export class Ground implements Entity<GroundProperties>, RadarEnabled {
    public props: Required<GroundProperties> = {
        client_x: 0,
        client_y: 0,
        terrain: "Normal",
        width: 0,
    };

    private container: PIXI.Container;
    private groundSprite: PIXI.TilingSprite;
    private water: PIXI.Graphics;

    constructor() {
        this.container = new PIXI.Container();
        const texture = Textures["ground1.gif"];
        this.groundSprite = new PIXI.TilingSprite(texture);
        this.water = new PIXI.Graphics();
        this.groundSprite.height = texture.height;

        this.container.addChild(this.water);
        this.container.addChild(this.groundSprite);

        this.container.zIndex = DrawLayer.Ground;
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public updateCallbacks: EntityUpdateCallbacks<GroundProperties> = {
        client_x: () => {
            const { client_x } = this.props;
            this.groundSprite.x = client_x;
            this.water.x = client_x;
        },
        client_y: () => {
            const { client_y } = this.props;
            this.groundSprite.y = client_y;
            this.water.y = client_y;
        },
        width: () => {
            this.groundSprite.width = this.props.width;
        },
        terrain: () => {
            const { terrain } = this.props;

            const textureMap: Record<Terrain, PIXI.Texture> = {
                Normal: Textures["ground1.gif"],
                Desert: Textures["groundDesert.gif"],
            };

            this.groundSprite.texture = textureMap[terrain];
            const color = TERRAIN_WATER_COLOR[terrain];
            this.water.clear();
            this.water.beginFill(color);
            this.water.drawRect(0, 0 + this.groundSprite.height - 2, this.groundSprite.width, 5000);
            this.water.endFill();
        },
    };

    public getRadarInfo(): RadarObject {
        return {
            type: RadarObjectType.Ground,
            x: this.props.client_x,
            y: this.props.client_y,
            width: this.props.width,
        };
    }

    public destroy() {}
}
