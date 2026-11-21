import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { Team } from "dogfight-types/Team";
import * as PIXI from "pixi.js";
import { IntlShape } from "react-intl";
import { GAME_INTL } from "../intl/messages";
import { GameClientCallbacks } from "./DogfightClient";
import { Textures } from "./textures";

const GAP = 10;
const FLAG_Y_OFFSET = 80;
const KEY_REPEAT_MS = 180;
const CHOICES: (Team | null)[] = ["Centrals", null, "Allies"];

export class TeamChooser {
    public container: PIXI.Container;

    private flags: PIXI.Sprite[];
    private highlight: PIXI.Graphics;
    private infoBox: PIXI.Sprite;
    private descriptionTexts: PIXI.Text[] = [];
    private chosen = 1;
    private lastMove = 0;
    private flagCenterY = 0;
    private screenCenterX = 0;
    private callbacks?: GameClientCallbacks;

    constructor() {
        this.container = new PIXI.Container();
        this.infoBox = new PIXI.Sprite();
        this.flags = [new PIXI.Sprite(), new PIXI.Sprite(), new PIXI.Sprite()];
        this.highlight = new PIXI.Graphics();

        this.container.addChild(this.infoBox);
        for (const flag of this.flags) {
            flag.interactive = true;
            this.container.addChild(flag);
        }
        this.container.addChild(this.highlight);
    }

    public init(callbacks: GameClientCallbacks, intl: IntlShape, screenWidth: number, gameHeight: number) {
        this.callbacks = callbacks;
        this.infoBox.texture = Textures["info_box.gif"];
        this.infoBox.position.set(5, 25);

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

        const lines = [
            intl.formatMessage(GAME_INTL.team_chooser_title),
            intl.formatMessage(GAME_INTL.team_chooser_line_1),
            intl.formatMessage(GAME_INTL.team_chooser_line_2),
            intl.formatMessage(GAME_INTL.team_chooser_line_3),
            intl.formatMessage(GAME_INTL.team_chooser_line_4),
            intl.formatMessage(GAME_INTL.team_chooser_line_5),
            intl.formatMessage(GAME_INTL.team_chooser_line_6),
        ];

        for (const text of this.descriptionTexts) {
            this.container.removeChild(text);
        }
        this.descriptionTexts = lines.map((line, index) => {
            const title = index === 0;
            const text = new PIXI.Text(line, {
                fontFamily: "Arial",
                fontSize: title ? 20 : 17,
                fontWeight: "bold",
                fill: title ? 0xffffff : 0xffff00,
            });
            const ascent = PIXI.TextMetrics.measureFont(text.style.toFontString()).ascent;
            const baseline = title ? 57 : 82 + (index - 1) * 22;
            text.position.set(title ? 22 : 27, baseline - ascent);
            this.container.addChild(text);
            return text;
        });

        this.drawHighlight();
    }

    public reset() {
        this.chosen = 1;
        this.drawHighlight();
    }

    public processKeys(keys: PlayerKeyboard) {
        const now = performance.now();
        if (now - this.lastMove >= KEY_REPEAT_MS) {
            if (keys.left && this.chosen > 0) {
                this.chosen -= 1;
                this.lastMove = now;
                this.drawHighlight();
            } else if (keys.right && this.chosen < 2) {
                this.chosen += 1;
                this.lastMove = now;
                this.drawHighlight();
            }
        }

        if (keys.enter) {
            this.choose();
        }
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
