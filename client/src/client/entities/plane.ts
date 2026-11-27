import { PlaneProperties } from "dogfight-types/PlaneProperties";
import { PlaneType } from "dogfight-types/PlaneType";
import { Team } from "dogfight-types/Team";
import * as PIXI from "pixi.js";
import { DEFAULT_TICK_INTERVAL, TaskFn, scheduler } from "../../gameLoop";
import { DrawLayer, MAX_ZOOM, TeamColor } from "../constants";
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

const FLIP_FRAME_DELAY_MS = 80;

function paddedSize(tex: PIXI.Texture): number {
    return Math.ceil(Math.sqrt(tex.width * tex.width + tex.height * tex.height));
}

function javaDrawCenter(tex: PIXI.Texture, base: PIXI.Texture, mirrored: boolean, angle: number): Point {
    const baseSize = paddedSize(base);
    const size = paddedSize(tex);
    const pivot = baseSize / 2;
    const cx = Math.floor((size - tex.width) / 2) + tex.width / 2;
    let cy = Math.floor((size - tex.height) / 2) + tex.height / 2;
    if (mirrored) cy = baseSize - cy;
    const dx = cx - pivot;
    const dy = cy - pivot;
    const shift = Math.trunc(-(size - baseSize) / 2);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: pivot + cos * dx - sin * dy + shift,
        y: pivot + sin * dx + cos * dy + shift,
    };
}

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
    private flipFrameTick: number = 0;
    private currentTick: number = 0;

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
        return paddedSize(this.getTexture());
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

    private createGraySmoke() {
        const offset = Math.floor(this.getPaddedSize() / 2) + 2;
        const x = Math.floor(this.props.client_x - Math.cos(this.angle) * offset);
        const y = Math.floor(this.props.client_y - Math.sin(this.angle) * offset);
        this.spawnSmoke(Textures["smoke1.gif"], x, y);
    }

    private darkSmokeInterval(): number {
        if (this.props.mode === "Falling") return 10;
        const delayMs = Math.max(100, Math.floor((600 * this.props.client_health) / 255));
        return Math.max(1, Math.round(delayMs / 10));
    }

    private animate: TaskFn = (tick) => {
        this.currentTick = tick;
        if (this.flipFrame !== 0 && (tick - this.flipFrameTick) * DEFAULT_TICK_INTERVAL > FLIP_FRAME_DELAY_MS) {
            this.flipFrame = this.flipFrame >= 3 ? 0 : ((this.flipFrame + 1) as 1 | 2 | 3);
            this.flipFrameTick = tick;
            this.renderFlipFrame();
        }

        if (tick % 10 === 0 && this.props.motor_on && this.isFlying()) {
            this.createGraySmoke();
        }

        const falling = this.props.mode === "Falling";
        const damaged = this.isFlying() && this.props.client_health < 255;
        if ((falling || damaged) && tick % this.darkSmokeInterval() === 0) {
            this.spawnSmoke(Textures["smoke2.gif"], this.props.client_x, this.props.client_y);
        }
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
        this.nameText.resolution = MAX_ZOOM;
        this.nameContainer.addChild(this.nameText);

        this.planeContainer = new PIXI.Container();
        this.planeContainer.addChild(this.planeSprite);
        this.container.addChild(this.planeContainer);

        this.container.zIndex = DrawLayer.Plane;
        this.smokeContainer.zIndex = DrawLayer.Smoke;
        this.nameContainer.zIndex = DrawLayer.Name;

        scheduler.scheduleRecurring(this.animate, 1);
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
        const base = this.getTexture();
        const texture = imageIndex === 0 ? base : Textures[`plane${id}_flip${imageIndex as 1 | 2}.gif`];
        this.planeSprite.texture = texture;

        const flipped = this.props.flipped;
        const mirrored = (flipped && (frame === 0 || frame === 3)) || (!flipped && frame !== 0);
        this.planeSprite.scale.y = mirrored ? -1 : 1;

        const drawn = javaDrawCenter(texture, base, mirrored, this.angle);
        const reference = javaDrawCenter(base, base, false, this.angle);
        this.planeSprite.position.set(drawn.x - reference.x, drawn.y - reference.y);
    }

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

        flipped: (oldProps) => {
            if (this.first_flip) {
                this.first_flip = false;
                this.flipFrame = 0;
            } else if (oldProps.flipped !== this.props.flipped) {
                this.flipFrame = 1;
                this.flipFrameTick = this.currentTick;
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
            this.renderFlipFrame();
        },
    };

    public destroy() {
        scheduler.unregister(this.animate);
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
