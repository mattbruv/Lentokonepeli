import { PlaneProperties } from "dogfight-types/PlaneProperties";
import { PlaneType } from "dogfight-types/PlaneType";
import { Team } from "dogfight-types/Team";
import * as PIXI from "pixi.js";
import { animationRunner } from "../../gameLoop";
import { DrawLayer, TeamColor } from "../constants";
import { directionToRadians } from "../helpers";
import { Stats } from "../hud";
import { RadarObject, RadarObjectType } from "../radar";
import { soundManager } from "../soundManager";
import { Textures } from "../textures";
import { Entity, EntityUpdateCallbacks, Followable, Point, RadarEnabled } from "./entity";

const PLANE_TEXTURE_ID: Record<PlaneType, number> = {
    Albatros: 4,
    Junkers: 5,
    Fokker: 6,
    Bristol: 7,
    Salmson: 8,
    Sopwith: 9,
};

const GRAY_SMOKE_LIFETIME_MS = 300;

const BLACK_SMOKE_LIFETIME_MS = 300;

export class Plane implements Entity<PlaneProperties>, Followable, RadarEnabled {
    private container: PIXI.Container;
    private planeContainer: PIXI.Container;
    private nameText: PIXI.Text;
    private planeSprite: PIXI.Sprite;
    private first_flip: boolean = true;
    private frame = 0;
    private dark_smoke_timeout: number;
    private darkSmoke: PIXI.Container;
    private angle: number = 0;

    public props: Required<PlaneProperties> = {
        team: "Allies",
        client_x: 0,
        client_y: 0,
        client_fuel: 0,
        flipped: false,
        mode: "Flying",
        motor_on: true,
        plane_type: "Albatros",
        direction: 0,
        total_bombs: 0,
        client_ammo: 0,
        client_health: 0,
    };

    private animate = () => {
        if (!this.props.motor_on || this.props.mode !== "Flying") return;

        const tex = this.getTexture();
        const w = tex.width;
        const h = tex.height;
        const d1 = this.angle;

        const x = this.planeContainer.position.x;
        const y = this.planeContainer.position.y;
        //console.log(this.planeSprite.position)

        const k = Math.floor(x - Math.cos(d1) * (w / 2 + 6));
        const m = Math.floor(y - Math.sin(d1) * (h / 2 + 6));

        const smoke = new PIXI.Sprite(Textures["smoke1.gif"]);
        smoke.anchor.set(0.5);
        smoke.position.set(k, m);
        //console.log(k, m)
        this.container.addChild(smoke);

        window.setTimeout(() => {
            this.container.removeChild(smoke);
        }, GRAY_SMOKE_LIFETIME_MS);
    };

    constructor() {
        this.container = new PIXI.Container();
        this.planeSprite = new PIXI.Sprite();
        this.planeSprite.anchor.set(0.5);
        this.darkSmoke = new PIXI.Container();

        this.nameText = new PIXI.Text("", {
            fontFamily: "arial",
            fontSize: 10,
        });

        this.nameText.anchor.set(0.5, 0);
        this.nameText.position.set(0, 25);

        this.planeContainer = new PIXI.Container();

        this.container.addChild(this.planeContainer);

        this.planeContainer.addChild(this.planeSprite);
        this.planeContainer.addChild(this.nameText);

        this.container.addChild(this.darkSmoke);

        this.container.zIndex = DrawLayer.Plane;

        this.dark_smoke_timeout = window.setTimeout(() => {
            this.createDarkSmoke();
        });

        animationRunner.registerAnimation(this.animate, 10);
    }

    private createDarkSmoke(): void {
        const percentage = this.props.client_health / 255;

        let smokeFrequency = 300;

        if (percentage < 0.9) {
            const smokeTex = Textures["smoke2.gif"];
            const smoke = new PIXI.Sprite(smokeTex);
            const smokePos = this.getSmokePosition(true);

            smoke.anchor.set(0.5);
            smoke.position.set(smokePos.x, smokePos.y);

            this.darkSmoke.addChild(smoke);

            if (percentage <= 0.66) {
                smokeFrequency = 200;
            }
            if (percentage <= 0.33) {
                smokeFrequency = 100;
            }

            window.setTimeout(() => {
                this.darkSmoke.removeChild(smoke);
            }, BLACK_SMOKE_LIFETIME_MS);
        }

        this.dark_smoke_timeout = window.setTimeout((): void => {
            this.createDarkSmoke();
        }, smokeFrequency);
    }

    private getSmokePosition(center: boolean): { x: number; y: number } {
        // direction = 0 -> 256   2^8
        const radians = directionToRadians(this.props.direction);
        const halfWidth = Math.round(this.planeSprite.width / 2);
        const offset = Math.round(halfWidth / 6);

        const r = halfWidth + offset;
        const theta = radians * -1;
        const deltaX = r * Math.cos(theta);
        const deltaY = r * Math.sin(theta);
        let newX: number, newY: number;
        if (center) {
            newX = this.props.client_x;
            newY = this.props.client_y;
        } else {
            newX = this.props.client_x - deltaX;
            newY = this.props.client_y - deltaY;
        }
        return { x: newX, y: newY };
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public getStats(): Stats {
        return {
            bombs: this.props.total_bombs,
            fuel: this.props.client_fuel,
            ammo: this.props.client_ammo,
            health: this.props.client_health,
        };
    }

    public getCenter(): Point {
        return {
            x: this.props.client_x ?? 0,
            y: this.props.client_y ?? 0,
        };
    }

    private getTexture() {
        const id = PLANE_TEXTURE_ID[this.props.plane_type];
        const flip = this.frame > 0 ? `_flip${this.frame}` : "";
        const key = `plane${id}${flip}.gif`;
        return Textures[key as keyof typeof Textures];
    }

    private renderFrame() {
        this.frame++;

        if (this.frame > 2) {
            this.frame = 0;
        }

        const texture = this.getTexture();
        this.planeSprite.texture = texture;

        if (this.frame !== 0) {
            window.setTimeout(() => {
                this.renderFrame();
            }, 80);
        }
    }

    public updateCallbacks: EntityUpdateCallbacks<PlaneProperties> = {
        client_x: () => {
            this.planeContainer.position.x = this.props.client_x;
        },
        client_y: () => {
            this.planeContainer.position.y = this.props.client_y;
        },
        team: () => {},
        client_ammo: () => {},
        client_health: () => {},
        client_fuel: () => {
            //console.log("fuel", this.props.client_fuel)
        },

        total_bombs: () => {
            console.log("Bombs", this.props.total_bombs);
        },

        flipped: () => {
            let do_flip = false;
            if (this.first_flip) {
                this.first_flip = false;
            } else {
                do_flip = true;
            }

            this.planeSprite.scale.y = this.props.flipped ? -1 : 1;

            if (do_flip) {
                this.frame = 0;
                this.renderFrame();
                //console.log(this.frame)
            }

            //console.log("flipped", this.props.flipped)
        },

        mode: () => {
            console.log("mode", this.props.mode);
        },

        motor_on: () => {
            soundManager.handlePlayMotorSound(this.props.motor_on);
            console.log("motor on", this.props.motor_on);
        },

        plane_type: () => {
            this.planeSprite.texture = this.getTexture();
        },

        direction: () => {
            // console.log(this.props.direction)
            this.angle = directionToRadians(this.props.direction);
            this.planeSprite.rotation = this.angle;
        },
    };

    public destroy() {
        animationRunner.unregisterAnimation(this.animate);
        window.clearTimeout(this.dark_smoke_timeout);
        if (this.props.motor_on) soundManager.handlePlayMotorSound(false);
    }

    public getRadarInfo(): RadarObject {
        return {
            type: RadarObjectType.Plane,
            team: this.props.team,
            x: this.props.client_x,
            y: this.props.client_y,
        };
    }

    public setPlayerName(name: string | null, pov_team: Team | null) {
        // console.log("set player name", name, pov_team)
        if (!name) {
            this.nameText.visible = false;
            return;
        }

        this.nameText.text = name.substring(0, 15);
        this.nameText.style.fill = this.getColor(pov_team);
        /*
    this.nameText = new PIXI.Text(name.substring(0, 15), {
      fontFamily: "arial",
      fontSize: 10,
      fill: this.getColor(this.props.team),
    })
      */
        this.nameText.visible = true;
    }

    private getColor(team: Team | null): TeamColor {
        if (team === null) return TeamColor.SpectatorForeground;
        if (this.props.team === null) return TeamColor.SpectatorForeground;

        if (team === this.props.team) {
            return TeamColor.OwnForeground;
        }

        return TeamColor.OpponentForeground;
    }
}
