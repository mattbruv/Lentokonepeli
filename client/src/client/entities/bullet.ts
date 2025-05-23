import { BulletProperties } from "dogfight-types/BulletProperties";
import { Howl } from "howler";
import * as PIXI from "pixi.js";
import { scheduler } from "../../gameLoop";
import { DrawLayer } from "../constants";
import { directionToRadians } from "../helpers";
import { soundManager } from "../soundManager";
import { Entity, EntityUpdateCallbacks } from "./entity";

const COLORS: string[] = ["#000000", "#171717", "#515151", "#606060", "#999999"];

export class Bullet implements Entity<BulletProperties> {
    private container: PIXI.Container;
    private bulletGraphics: PIXI.Graphics;

    private sound: Howl;
    private age = 1;

    public isGameRunning: boolean = true;

    public props: Required<BulletProperties> = {
        client_x: 0,
        client_y: 0,
        speed: 0,
        direction: 0,
    };

    private animate = () => {
        if (this.isGameRunning) {
            this.move_bullet();
        }
    };

    constructor() {
        this.container = new PIXI.Container();
        this.bulletGraphics = new PIXI.Graphics();

        this.bulletGraphics.clear();
        this.bulletGraphics.beginFill(COLORS[0]);
        this.bulletGraphics.drawRect(0, 0, 4, 4);
        this.bulletGraphics.endFill();

        //this.bulletGraphics.anchor.set(0.5, 0.5)
        //this.bulletGraphics.position.set(texture.width / 2, texture.height / 2)
        this.container.addChild(this.bulletGraphics);

        // play bullet sound
        this.sound = new Howl({
            src: "audio/m16.mp3",
        });

        soundManager.playSound(this.sound);

        this.container.zIndex = DrawLayer.Bullet;

        scheduler.scheduleRecurring(this.animate, 1);
    }

    private move_bullet() {
        this.age++;

        const angle = directionToRadians(this.props.direction);

        this.props.client_x += (this.props.speed / 25.0) * Math.cos(angle);
        this.props.client_y += (this.props.speed / 25.0) * Math.sin(angle);

        let i = Math.floor((COLORS.length * this.age) / 175);
        i = i >= COLORS.length ? COLORS.length - 1 : i;

        const color = COLORS[i];

        this.bulletGraphics.clear();
        this.bulletGraphics.beginFill(color);
        this.bulletGraphics.drawRect(0, 0, 2, 2);
        this.bulletGraphics.endFill();

        this.updateCallbacks.client_x({ ...this.props });
        this.updateCallbacks.client_y({ ...this.props });
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public updateCallbacks: EntityUpdateCallbacks<BulletProperties> = {
        client_x: () => {
            this.container.position.x = this.props.client_x;
            //console.log("bullet X: " + this.props.client_x)
        },
        client_y: () => {
            this.container.position.y = this.props.client_y;
            //console.log("bullet y: " + this.props.client_y)
        },
        speed: () => {
            //console.log("speed", this.props.speed)
        },
        direction: () => {
            // console.log(this.props.direction)
            //this.bulletGraphics.rotation = directionToRadians(this.props.direction)
        },
    };

    public destroy() {
        this.sound.stop();
        scheduler.unregister(this.animate);
    }
}
