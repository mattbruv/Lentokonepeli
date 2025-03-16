import * as PIXI from "pixi.js";
import { GameClientCallbacks } from "./DogfightClient";
import { Textures } from "./textures";

export class TeamChooser {
    public container: PIXI.Container;

    public flag_centrals: PIXI.Sprite;
    public flag_random: PIXI.Sprite;
    public flag_allies: PIXI.Sprite;

    constructor() {
        this.container = new PIXI.Container();

        this.flag_centrals = new PIXI.Sprite();
        this.flag_random = new PIXI.Sprite();
        this.flag_allies = new PIXI.Sprite();

        this.flag_centrals.interactive = true;
        this.flag_random.interactive = true;
        this.flag_allies.interactive = true;

        this.container.addChild(this.flag_centrals);
        this.container.addChild(this.flag_random);
        this.container.addChild(this.flag_allies);

        //this.container.anchor.set();
    }

    public init(callbacks: GameClientCallbacks) {
        this.flag_centrals.texture = Textures["germanflag.jpg"];
        this.flag_random.texture = Textures["randomflag.jpg"];
        this.flag_allies.texture = Textures["royalairforcesflag.jpg"];

        const gap = 15;
        const width = this.flag_centrals.width;

        this.flag_random.position.x = width + gap;
        this.flag_allies.position.x = this.flag_random.width + width + gap * 2;

        this.flag_allies.onclick = () => {
            callbacks.chooseTeam("Allies");
        };

        this.flag_centrals.onclick = () => {
            callbacks.chooseTeam("Centrals");
        };

        this.flag_random.onclick = () => {
            callbacks.chooseTeam(null);
        };
    }
}
