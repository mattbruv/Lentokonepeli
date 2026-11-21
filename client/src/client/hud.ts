import * as PIXI from "pixi.js";
import { Textures } from "./textures";
import { Team } from "dogfight-types/Team";
import { Radar } from "./radar";

export type Stats = {
    health?: number;
    fuel?: number;
    ammo?: number;
    bombs?: number;
};

export class GameHUD {
    public container: PIXI.Container;

    private panel: PIXI.Sprite;
    private stats: PIXI.Graphics;
    private bombs: PIXI.Container;
    private teamScores: PIXI.Graphics;
    private centralsScoreText: PIXI.Text;
    private alliesScoreText: PIXI.Text;
    public radar: Radar;
    private previousStats: Stats;

    constructor() {
        this.container = new PIXI.Container();

        this.panel = new PIXI.Sprite();
        this.stats = new PIXI.Graphics();
        this.bombs = new PIXI.Container();
        this.radar = new Radar();
        this.teamScores = new PIXI.Graphics();
        this.centralsScoreText = new PIXI.Text("0", { fontFamily: "Arial", fontSize: 15, fill: "white" });
        this.alliesScoreText = new PIXI.Text("0", { fontFamily: "Arial", fontSize: 15, fill: "white" });
        this.centralsScoreText.anchor.set(0, 1);
        this.alliesScoreText.anchor.set(0, 1);
        this.centralsScoreText.position.set(65, 69);
        this.alliesScoreText.position.set(65, 126);

        this.bombs.position.set(296, 108);

        this.previousStats = {};

        this.container.addChild(this.panel);
        this.container.addChild(this.stats);
        this.container.addChild(this.bombs);
        this.container.addChild(this.teamScores);
        this.container.addChild(this.centralsScoreText);
        this.container.addChild(this.alliesScoreText);
        this.container.addChild(this.radar.container);
    }

    public init() {
        this.panel.texture = Textures["metalpanel.jpg"];

        for (let i = 0; i < 5; i++) {
            const sprite = new PIXI.Sprite(Textures["droppedbomb.gif"]);
            sprite.position.set(i * 14, 0);
            this.bombs.addChild(sprite);
        }
    }

    public updateStats(stats: Stats) {
        if (JSON.stringify(stats) == JSON.stringify(this.previousStats)) return;
        this.previousStats = stats;

        // update bomb count
        const bombCount = stats.bombs ?? 0;
        for (let i = 0; i < 5; i++) {
            const bomb = this.bombs.children[i] as PIXI.Sprite;
            const tex = i < bombCount ? Textures["carrybomb.gif"] : Textures["droppedbomb.gif"];
            bomb.texture = tex;
        }

        this.stats.clear();
        this.stats.beginFill("white");

        // draw health bar
        const health = (stats.health ?? 0) / 255;
        this.stats.drawRect(290, 44, 74 * health, 12);

        // draw fuel
        const fuel = (stats.fuel ?? 0) / 255;
        //console.log(stats.fuel, fuel)
        this.stats.drawRect(290, 65, 74 * fuel, 12);

        // draw ammo
        const ammo = (stats.ammo ?? 0) / 255;
        this.stats.drawRect(290, 86, 74 * ammo, 12);

        //this.stats.beginFill("yellow")
        //this.stats.drawRect(0, 0, 50, 100)

        this.stats.endFill();
    }

    public updateTeamScores(centrals: number, allies: number, myTeam: Team | null) {
        const own = 0x0000ff;
        const opponent = 0xff0000;
        const c = Math.max(centrals, 0);
        const a = Math.max(allies, 0);
        const total = c + a;

        this.teamScores.clear();

        this.teamScores.beginFill(myTeam === "Centrals" ? own : opponent);
        this.teamScores.drawRect(64, 29, total === 0 ? 0 : Math.floor((129 * c) / total), 14);
        this.teamScores.endFill();

        this.teamScores.beginFill(myTeam === "Allies" ? own : opponent);
        this.teamScores.drawRect(64, 86, total === 0 ? 0 : Math.floor((129 * a) / total), 14);
        this.teamScores.endFill();

        this.centralsScoreText.text = `${centrals}`;
        this.alliesScoreText.text = `${allies}`;
    }

    public setTeam(team?: Team) {
        if (team === undefined || team === "Centrals") {
            this.panel.texture = Textures["metalpanel.jpg"];
        }
        if (team === "Allies") {
            this.panel.texture = Textures["woodpanel.jpg"];
        }
        this.radar.setTeam(team);
    }
}
