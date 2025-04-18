import { WaterProperties } from "dogfight-types/WaterProperties";
import * as PIXI from "pixi.js";
import { scheduler } from "../../gameLoop";
import { DrawLayer, TERRAIN_WATER_COLOR } from "../constants";
import { Textures } from "../textures";
import { Entity, EntityUpdateCallbacks } from "./entity";

export class Water implements Entity<WaterProperties> {
    public props: Required<WaterProperties> = {
        client_x: 0,
        client_y: 0,
        facing: "Left",
        terrain: "Normal",
        width: 0,
    };
    private container: PIXI.Container;
    private waterGraphics: PIXI.Graphics;
    private waves: PIXI.TilingSprite;

    private waveIndex = 0;

    private animate = () => {
        this.waveStep();
    };

    constructor() {
        this.container = new PIXI.Container();
        this.waterGraphics = new PIXI.Graphics();

        const wave1 = Textures["wave-l_1.gif"];
        this.waves = new PIXI.TilingSprite(wave1);
        this.waves.height = wave1.height;

        scheduler.scheduleRecurring(this.animate, 20);

        this.container.addChild(this.waterGraphics);
        this.container.addChild(this.waves);

        this.container.zIndex = DrawLayer.Water;
    }

    public updateCallbacks: EntityUpdateCallbacks<WaterProperties> = {
        client_x: () => {
            const { client_x } = this.props;
            if (client_x === undefined) return;
            this.waterGraphics.position.x = client_x;
            this.waves.position.x = client_x;
        },
        client_y: () => {
            const { client_y } = this.props;
            if (client_y === undefined) return;
            this.waterGraphics.position.y = client_y;
            this.waves.position.y = client_y;
        },
        facing: () => {
            const { facing } = this.props;
            if (facing === undefined) return;
            this.waves.anchor.x = facing === "Left" ? 0 : 1;
            this.waves.scale.x = facing === "Left" ? 1 : -1;
        },
        terrain: () => {
            const { terrain } = this.props;
            if (terrain === undefined) return;
            const color = TERRAIN_WATER_COLOR[terrain];
            this.waterGraphics.clear();
            this.waterGraphics.beginFill(color);
            this.waterGraphics.drawRect(0, 0, this.waves.width, 5000);
            this.waterGraphics.endFill();
        },
        width: () => {
            const { width } = this.props;
            if (width === undefined) return;
            this.waterGraphics.width = width;
            this.waves.width = width;
        },
    };

    private waveStep() {
        const str = `wave-l_${this.waveIndex}.gif`;

        const map: Record<string, PIXI.Texture> = {
            "wave-l_1.gif": Textures["wave-l_1.gif"],
            "wave-l_2.gif": Textures["wave-l_2.gif"],
            "wave-l_3.gif": Textures["wave-l_3.gif"],
            "wave-l_4.gif": Textures["wave-l_4.gif"],
            "wave-l_5.gif": Textures["wave-l_5.gif"],
            "wave-l_6.gif": Textures["wave-l_6.gif"],
            "wave-l_7.gif": Textures["wave-l_7.gif"],
        };

        const waveTexture = map[str];
        this.waves.texture = waveTexture;

        this.waveIndex += 1;
        if (this.waveIndex == 8) {
            this.waveIndex = 0;
        }
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public destroy() {
        scheduler.unregister(this.animate);
    }
}
