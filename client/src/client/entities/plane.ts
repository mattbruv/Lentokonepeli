import { PlaneProperties } from "dogfight-types/PlaneProperties";
import { PlaneType } from "dogfight-types/PlaneType";
import { Team } from "dogfight-types/Team";
import * as PIXI from "pixi.js";
import { TaskFn, scheduler } from "../../gameLoop";
import { DrawLayer, TeamColor } from "../constants";
import { directionToRadians } from "../helpers";
import { Stats } from "../hud";
import { RadarObject, RadarObjectType } from "../radar";
import { Textures } from "../textures";
import { Entity, EntityUpdateCallbacks, Followable, Point, RadarEnabled } from "./entity";

const PLANE_TEXTURE_ID = {
    Albatros: 4,
    Junkers: 5,
    Fokker: 6,
    Bristol: 7,
    Salmson: 8,
    Sopwith: 9,
} as const satisfies Record<PlaneType, number>;

export class Plane implements Entity<PlaneProperties>, Followable, RadarEnabled {
    private container: PIXI.Container;
    private planeContainer: PIXI.Container;
    private nameText: PIXI.Text;
    private planeSprite: PIXI.Sprite;
    private first_flip: boolean = true;
    private smokeContainer: PIXI.Container;
    private nameContainer: PIXI.Container;
    private angle: number = 0;
    private flipFrame: 0 | 1 | 2 | 3 = 0;

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

    private getPaddedSize(): number {
        const tex = this.getTexture();
        return Math.ceil(Math.sqrt(tex.width * tex.width + tex.height * tex.height));
    }

    private spawnSmoke(texture: PIXI.Texture, x: number, y: number) {
        const smoke = new PIXI.Sprite(texture);
        smoke.anchor.set(0.5);
        smoke.position.set(x, y);
        this.smokeContainer.addChild(smoke);
        scheduler.scheduleTask(() => this.smokeContainer.removeChild(smoke), 30);
    }

    private isFlying(): boolean {
        return this.props.mode === "Flying" || this.props.mode === "Dodging";
    }

    private createGraySmoke: TaskFn = () => {
        const offset = Math.floor(this.getPaddedSize() / 2) + 2;
        const x = Math.floor(this.props.client_x - Math.cos(this.angle) * offset);
        const y = Math.floor(this.props.client_y - Math.sin(this.angle) * offset);
        this.spawnSmoke(Textures["smoke1.gif"], x, y);
    };

    private createDarkSmoke: TaskFn = () => {
        const falling = this.props.mode === "Falling";
        const damaged = this.isFlying() && this.props.client_health < 255;

        let delayMs = 100;
        if (!falling) {
            delayMs = Math.max(100, Math.floor((600 * this.props.client_health) / 255));
        }

        if (falling || damaged) {
            this.spawnSmoke(Textures["smoke2.gif"], this.props.client_x, this.props.client_y);
        }

        scheduler.scheduleTask(this.createDarkSmoke, Math.max(1, Math.round(delayMs / 10)));
    };

    private animate: TaskFn = () => {
        if (!this.props.motor_on || !this.isFlying()) return;
        this.createGraySmoke(0);
    };

    constructor() {
        this.container = new PIXI.Container();
        this.planeSprite = new PIXI.Sprite();
        this.planeSprite.anchor.set(0.5);
        this.smokeContainer = new PIXI.Container();
        this.nameContainer = new PIXI.Container();

        this.nameText = new PIXI.Text("", {
            fontFamily: "arial",
            fontSize: 10,
        });
        this.nameContainer.addChild(this.nameText);

        this.planeContainer = new PIXI.Container();
        this.planeContainer.addChild(this.planeSprite);
        this.container.addChild(this.planeContainer);

        this.container.zIndex = DrawLayer.Plane;
        this.smokeContainer.zIndex = DrawLayer.Smoke;
        this.nameContainer.zIndex = DrawLayer.Name;

        scheduler.scheduleRecurring(this.animate, 10);
        scheduler.scheduleTask(this.createDarkSmoke, 10);
    }

    private positionName() {
        const half = Math.floor(this.getPaddedSize() / 2);
        const ascent = PIXI.TextMetrics.measureFont(this.nameText.style.toFontString()).ascent;
        this.nameText.position.set(this.props.client_x - half, this.props.client_y - half + 45 - ascent);
    }

    public getContainer(): PIXI.Container[] {
        return [this.container, this.smokeContainer, this.nameContainer];
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
        return Textures[`plane${id}.gif`];
    }

    private renderFlipFrame() {
        const frame = this.flipFrame;
        const imageIndex = frame === 3 ? 1 : frame;
        const id = PLANE_TEXTURE_ID[this.props.plane_type];
        this.planeSprite.texture =
            imageIndex === 0 ? this.getTexture() : Textures[`plane${id}_flip${imageIndex as 1 | 2}.gif`];

        const flipped = this.props.flipped;
        const mirrored = (flipped && (frame === 0 || frame === 3)) || (!flipped && frame !== 0);
        this.planeSprite.scale.y = mirrored ? -1 : 1;
    }

    private advanceFlip: TaskFn = () => {
        this.flipFrame = this.flipFrame >= 3 ? 0 : ((this.flipFrame + 1) as 1 | 2 | 3);
        this.renderFlipFrame();
        if (this.flipFrame !== 0) {
            scheduler.scheduleTask(this.advanceFlip, 8);
        }
    };

    public updateCallbacks: EntityUpdateCallbacks<PlaneProperties> = {
        client_x: () => {
            this.planeContainer.position.x = this.props.client_x;
            this.positionName();
        },
        client_y: () => {
            this.planeContainer.position.y = this.props.client_y;
            this.positionName();
        },
        team: () => {},
        client_ammo: () => {},
        client_health: () => {},
        client_fuel: () => {},

        total_bombs: () => {
            console.log("Bombs", this.props.total_bombs);
        },

        flipped: () => {
            scheduler.unregister(this.advanceFlip);
            if (this.first_flip) {
                this.first_flip = false;
                this.flipFrame = 0;
            } else {
                this.flipFrame = 1;
                scheduler.scheduleTask(this.advanceFlip, 8);
            }
            this.renderFlipFrame();
        },

        mode: () => {
            console.log("mode", this.props.mode);
        },

        motor_on: () => {
            console.log("motor on", this.props.motor_on);
        },

        plane_type: () => {
            this.renderFlipFrame();
            this.positionName();
        },

        direction: () => {
            this.angle = directionToRadians(this.props.direction);
            this.planeSprite.rotation = this.angle;
        },
    };

    public destroy() {
        scheduler.unregister(this.animate);
        scheduler.unregister(this.createDarkSmoke);
        scheduler.unregister(this.advanceFlip);
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
