import { Team } from "dogfight-types/Team";
import * as PIXI from "pixi.js";
import { GameClientCallbacks } from "./DogfightClient";
import { Textures } from "./textures";

const GAP = 10;
const FLAG_Y_OFFSET = 80;
const CHOICES: (Team | null)[] = ["Centrals", null, "Allies"];

export class TeamChooser {
    public container: PIXI.Container;

    private flags: PIXI.Sprite[];
    private highlight: PIXI.Graphics;
    private chosen = 1;
    private flagCenterY = 0;
    private screenCenterX = 0;
    private callbacks?: GameClientCallbacks;

    constructor() {
        this.container = new PIXI.Container();
        this.flags = [new PIXI.Sprite(), new PIXI.Sprite(), new PIXI.Sprite()];
        this.highlight = new PIXI.Graphics();

        for (const flag of this.flags) {
            flag.eventMode = "static";
            this.container.addChild(flag);
        }
        this.container.addChild(this.highlight);
    }

    public init(callbacks: GameClientCallbacks, screenWidth: number, gameHeight: number) {
        this.callbacks = callbacks;
        this.flags[0].texture = Textures["germanflag.jpg"];
        this.flags[1].texture = Textures["randomflag.jpg"];
        this.flags[2].texture = Textures["royalairforcesflag.jpg"];

        this.screenCenterX = Math.trunc(screenWidth / 2);
        this.flagCenterY = Math.trunc(gameHeight / 2) + FLAG_Y_OFFSET;

        const flagWidth = this.flags[0].texture.width;
        const flagHeight = this.flags[0].texture.height;
        const left = this.screenCenterX - GAP - Math.trunc((flagWidth * 3) / 2);
        const top = this.flagCenterY - Math.trunc(flagHeight / 2);

        this.flags.forEach((flag, index) => {
            flag.position.set(left + index * (GAP + flagWidth), top);
            flag.onclick = () => {
                this.chosen = index;
                this.drawHighlight();
                this.choose();
            };
        });

        this.drawHighlight();
    }

    public setClickable(clickable: boolean) {
        for (const flag of this.flags) {
            flag.eventMode = clickable ? "static" : "none";
        }
    }

    public setChosen(option: number) {
        this.chosen = Math.min(2, Math.max(0, option));
        this.drawHighlight();
    }

    private choose() {
        this.callbacks?.chooseTeam(CHOICES[this.chosen]);
    }

    private drawHighlight() {
        const flag = this.flags[this.chosen];
        const width = flag.texture.width;
        const height = flag.texture.height;
        const x = flag.position.x;
        const y = flag.position.y;

        this.highlight.clear();
        this.highlight.lineStyle(1, 0xffff00, 1, 0);
        this.highlight.drawRect(x, y, width, height);
        this.highlight.drawRect(x - 1, y - 1, width + 2, height + 2);
        this.highlight.drawRect(x - 2, y - 2, width + 4, height + 4);
    }
}
