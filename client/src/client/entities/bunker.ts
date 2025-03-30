import { BunkerProperties } from "dogfight-types/BunkerProperties";
import { Team } from "dogfight-types/Team";
import * as PIXI from "pixi.js";
import { Blinker } from "../Blinker";
import { DrawLayer, TeamColor } from "../constants";
import { RadarObject, RadarObjectType } from "../radar";
import { Textures } from "../textures";
import { Entity, EntityUpdateCallbacks, RadarEnabled } from "./entity";

export class Bunker implements Entity<BunkerProperties>, RadarEnabled {
    public props: Required<BunkerProperties> = {
        team: "Allies",
        client_x: 0,
        client_y: 0,
        client_health: 0,
    };

    private container: PIXI.Container;
    private bunkerSprite: PIXI.Sprite;
    private healthBar: PIXI.Graphics;
    private lastHealth = 0;
    private userTeam: Team = "Allies";

    // This can't be static, because the textures will return undefined if they haven't loaded before
    // this file is ran in JS for the first time.
    private textures = {
        Centrals: Textures["headquarter_germans.gif"],
        Allies: Textures["headquarter_raf.gif"],
        Destroyed: Textures["headquarter_broke.gif"],
    };
    blinker: Blinker;

    constructor() {
        this.container = new PIXI.Container();
        this.bunkerSprite = new PIXI.Sprite();
        this.healthBar = new PIXI.Graphics();

        this.container.addChild(this.bunkerSprite);
        this.container.addChild(this.healthBar);

        this.container.zIndex = DrawLayer.Bunker;
        this.blinker = new Blinker([this.bunkerSprite]);
    }

    public getRadarInfo(): RadarObject {
        const halfWidth = Math.round(this.bunkerSprite.width / 2);
        const x = this.props.client_x;
        const offset = halfWidth;
        return {
            type: RadarObjectType.Bunker,
            x: x + offset,
            y: this.props.client_y + this.container.height - 5,
            health: this.props.client_health,
            team: this.props.team,
            width: this.bunkerSprite.width,
        };
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public updateCallbacks: EntityUpdateCallbacks<BunkerProperties> = {
        team: () => {},
        client_x: () => {
            const { client_x } = this.props;
            if (client_x === undefined) return;
            this.container.position.x = client_x;
        },
        client_health: () => {
            this.updateTexture();
            this.drawHealthBar();

            if (this.props.client_health < this.lastHealth) {
                this.blinker.tryBlink();
            }

            this.lastHealth = this.props.client_health;
        },
        client_y: () => {
            const { client_y } = this.props;
            if (client_y === undefined) return;
            this.container.position.y = client_y - 3;
        },
    };

    public updateProps(_props: BunkerProperties): void {}

    public setUserTeam(userTeam: Team): void {
        this.userTeam = userTeam;
        this.updateTexture();
        console.log(this);
        this.drawHealthBar();
    }

    public destroy() {}

    private drawHealthBar() {
        const { team, client_health } = this.props;

        if (client_health <= 0) {
            this.healthBar.visible = false;
            return;
        }

        this.healthBar.visible = true;

        const tex = this.getTexture();
        this.healthBar.position.y = tex.height;
        this.healthBar.position.x = 10;

        const color = team === this.userTeam ? TeamColor.OwnBackground : TeamColor.OpponentBackground;
        const amount = Math.round(tex.width * (client_health / 350));

        this.healthBar.clear();
        this.healthBar.beginFill(color);
        this.healthBar.drawRect(0, 0, amount, 3);
        this.healthBar.endFill();
    }

    private getTexture() {
        if (this.props.client_health <= 0) return this.textures.Destroyed;
        return this.textures[this.props.team];
    }

    private updateTexture() {
        this.bunkerSprite.texture = this.getTexture();
    }
}
