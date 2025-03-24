import { BunkerProperties } from "dogfight-types/BunkerProperties";
import * as PIXI from "pixi.js";
import { DrawLayer, TeamColor } from "../constants";
import { Textures } from "../textures";
import { Entity, EntityUpdateCallbacks } from "./entity";
import { soundManager } from "../soundManager";
import { Team } from "dogfight-types/Team";
import { Runway } from "./runway";

export class Bunker implements Entity<BunkerProperties> {
    public props: Required<BunkerProperties> = {
        team: "Allies",
        client_x: 0,
        client_y: 0,
        client_health: 0,
    };

    private container: PIXI.Container;
    private bunkerTexture: PIXI.Sprite;
    private healthBar: PIXI.Graphics;
    private blinking = false;
    private lastHealth = 0;
    private userTeam: Team = "Allies";

    static textures = {
        Centrals: Textures["headquarter_germans.gif"],
        Allies: Textures["headquarter_raf.gif"],
        Destroyed: Textures["headquarter_broke.gif"],
    };

    constructor() {
        this.container = new PIXI.Container();
        this.bunkerTexture = new PIXI.Sprite();
        this.healthBar = new PIXI.Graphics();

        this.container.addChild(this.bunkerTexture);
        this.container.addChild(this.healthBar);

        this.container.zIndex = DrawLayer.Bunker;
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

            if (this.props.client_health < this.lastHealth && !this.blinking) {
                // blink
                const filter = new PIXI.ColorMatrixFilter();
                filter.matrix = Runway.getHealthBarMatrix();
                this.bunkerTexture.filters = [filter];
                this.blinking = true;

                // play blink sound
                soundManager.playSound(
                    new Howl({
                        src: "audio/hit.mp3",
                    }),
                );

                window.setTimeout(() => {
                    this.blinking = false;
                    this.bunkerTexture.filters = null;
                }, 100);
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
        if (this.props.client_health <= 0) return Bunker.textures.Destroyed;
        return Bunker.textures[this.props.team];
    }

    private updateTexture() {
        this.bunkerTexture.texture = this.getTexture();
    }
}
