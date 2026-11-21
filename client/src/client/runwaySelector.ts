import { PlaneType } from "dogfight-types/PlaneType";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { Team } from "dogfight-types/Team";
import * as PIXI from "pixi.js";
import { IntlShape } from "react-intl";
import { GAME_INTL } from "../intl/messages";
import { GameClientCallbacks } from "./DogfightClient";
import { Point } from "./entities/entity";
import { Runway } from "./entities/runway";
import { EntityGroup } from "./EntityManager";
import { Textures } from "./textures";

type PlaneData = {
    plane_type: PlaneType;
    plane_name: string;
    plane_description: string;
    texture: PIXI.Texture;
};

type PlaneMap = Record<Team, PlaneData[]>;

const DESCRIPTION_LINE_HEIGHT = 25;

export class RunwaySelector {
    public container: PIXI.Container;

    public infoBox: PIXI.Sprite;
    private lowQualityBox: PIXI.Graphics;
    public planeImage: PIXI.Sprite;
    public planeNameText: PIXI.Text;
    public planeDescriptionText: PIXI.Text;

    public planeMap: PlaneMap;
    private team: Team = "Centrals";
    private index = 0;
    private runwayIndex = 0;

    callbacks?: GameClientCallbacks;

    constructor() {
        this.container = new PIXI.Container();

        this.infoBox = new PIXI.Sprite();
        this.planeImage = new PIXI.Sprite();
        this.planeNameText = new PIXI.Text("", {
            fontFamily: "Arial",
            fontSize: 20,
            fill: 0xffffff,
            fontWeight: "bold",
        });
        this.planeDescriptionText = new PIXI.Text("", {
            fontFamily: "Arial",
            fontSize: 17,
            lineHeight: DESCRIPTION_LINE_HEIGHT,
            fill: 0,
            wordWrap: true,
            wordWrapWidth: 275,
            fontWeight: "bold",
        });

        this.lowQualityBox = new PIXI.Graphics();
        this.lowQualityBox.visible = false;
        this.container.addChild(this.lowQualityBox);
        this.container.addChild(this.infoBox);
        this.container.addChild(this.planeImage);
        this.container.addChild(this.planeNameText);
        this.container.addChild(this.planeDescriptionText);
        this.container.visible = false;

        this.planeImage.position.set(10);
        const nameFont = PIXI.TextMetrics.measureFont(this.planeNameText.style.toFontString());
        this.planeNameText.position.set(10, 158 - nameFont.ascent);
        const descriptionFont = PIXI.TextMetrics.measureFont(this.planeDescriptionText.style.toFontString());
        const lineShift = Math.max(0, (DESCRIPTION_LINE_HEIGHT - descriptionFont.fontSize) / 2);
        this.planeDescriptionText.position.set(15, 190 - descriptionFont.ascent - lineShift);

        this.planeMap = {
            Allies: [],
            Centrals: [],
        };
    }

    public init(callbacks: GameClientCallbacks, intl: IntlShape) {
        this.callbacks = callbacks;
        this.infoBox.texture = Textures["selectionScreen.gif"];
        this.lowQualityBox.clear();
        this.lowQualityBox.beginFill(0x808080);
        this.lowQualityBox.drawRect(0, 0, this.infoBox.texture.width, this.infoBox.texture.height);
        this.lowQualityBox.endFill();

        this.planeMap.Centrals.push({
            plane_type: "Albatros",
            texture: Textures["pic_plane4.gif"],
            plane_name: intl.formatMessage(GAME_INTL.plane_name_Albatros),
            plane_description: intl.formatMessage(GAME_INTL.plane_description_Albatros),
        });

        this.planeMap.Centrals.push({
            plane_type: "Junkers",
            texture: Textures["pic_plane5.gif"],
            plane_name: intl.formatMessage(GAME_INTL.plane_name_Junkers),
            plane_description: intl.formatMessage(GAME_INTL.plane_description_Junkers),
        });

        this.planeMap.Centrals.push({
            plane_type: "Fokker",
            texture: Textures["pic_plane6.gif"],
            plane_name: intl.formatMessage(GAME_INTL.plane_name_Fokker),
            plane_description: intl.formatMessage(GAME_INTL.plane_description_Fokker),
        });

        this.planeMap.Allies.push({
            plane_type: "Bristol",
            texture: Textures["pic_plane7.gif"],
            plane_name: intl.formatMessage(GAME_INTL.plane_name_Bristol),
            plane_description: intl.formatMessage(GAME_INTL.plane_description_Bristol),
        });

        this.planeMap.Allies.push({
            plane_type: "Salmson",
            texture: Textures["pic_plane8.gif"],
            plane_name: intl.formatMessage(GAME_INTL.plane_name_Salmson),
            plane_description: intl.formatMessage(GAME_INTL.plane_description_Salmson),
        });

        this.planeMap.Allies.push({
            plane_type: "Sopwith",
            texture: Textures["pic_plane9.gif"],
            plane_name: intl.formatMessage(GAME_INTL.plane_name_Sopwith),
            plane_description: intl.formatMessage(GAME_INTL.plane_description_Sopwith),
        });

        this.updatePlaneInfo();
    }

    setTeam(team: Team) {
        this.team = team;
        this.planeImage.texture = this.planeMap[this.team][this.index].texture;
        this.updatePlaneInfo();
    }

    private updatePlaneInfo() {
        const map = this.planeMap[this.team];
        this.planeImage.texture = map[this.index].texture;
        const planeData = map[this.index];
        this.planeNameText.text = planeData.plane_name;
        this.planeDescriptionText.text = planeData.plane_description;
    }

    processKeys(
        keys: PlayerKeyboard,
        runways: EntityGroup<Runway>,
        centerCamera: (runwayPos: Point) => void,
        selectRunway: (runwayId: number, plane: PlaneType) => void,
    ) {
        const map = this.planeMap[this.team];

        if (keys.down) {
            this.index = this.index - 1 < 0 ? map.length - 1 : this.index - 1;
        }

        if (keys.up) {
            this.index = this.index + 1 >= map.length ? 0 : this.index + 1;
        }

        this.updatePlaneInfo(); // Update name and description when plane changes

        const myRunways = this.getMyRunways(runways);
        if (myRunways.length === 0) return;
        this.runwayIndex = Math.min(this.runwayIndex, myRunways.length - 1);

        if (keys.left) {
            this.runwayIndex = this.runwayIndex - 1 < 0 ? myRunways.length - 1 : this.runwayIndex - 1;
        }

        if (keys.right) {
            this.runwayIndex = this.runwayIndex + 1 >= myRunways.length ? 0 : this.runwayIndex + 1;
        }

        this.selectRunway(runways, centerCamera);

        if (keys.enter) {
            const planeType = map[this.index].plane_type;
            const runwayId = myRunways[this.runwayIndex][0];
            selectRunway(runwayId, planeType);
        }
    }

    public selectRunway(runways: EntityGroup<Runway>, centerCamera: (runwayPos: Point) => void) {
        const myRunways = this.getMyRunways(runways);
        if (myRunways.length === 0) return;
        this.runwayIndex = Math.min(this.runwayIndex, myRunways.length - 1);
        centerCamera(this.getCameraTarget(myRunways[this.runwayIndex][1], false));
    }

    public preferRunway(runways: EntityGroup<Runway>, runwayId: number) {
        const index = this.getMyRunways(runways).findIndex(([id]) => id === runwayId);
        if (index !== -1) {
            this.runwayIndex = index;
        }
    }

    public getCameraTarget(runway: Runway, landed: boolean): Point {
        const panel = Textures["selectionScreen.gif"];
        const offsets: Record<Team, [number, number]> = landed
            ? { Centrals: [-65, -140], Allies: [30, -140] }
            : { Centrals: [-100, -300], Allies: [60, -300] };
        const [dx, dy] = offsets[runway.props.team];
        return {
            x: runway.props.client_x + dx + Math.trunc(panel.width / 2),
            y: runway.props.client_y + dy + Math.trunc(panel.height / 2),
        };
    }

    public setHighQuality(high: boolean) {
        this.infoBox.visible = high;
        this.planeImage.visible = high;
        this.lowQualityBox.visible = !high;
    }

    public getSelectedPlaneType(): PlaneType {
        return this.planeMap[this.team][this.index].plane_type;
    }

    private getMyRunways(runways: EntityGroup<Runway>): [number, Runway][] {
        return [...runways.collection.entries()]
            .filter(([_, runway]) => runway.props.team === this.team && runway.props.client_health > 0)
            .sort((a, b) => (a[1].props.client_x ?? 0) - (b[1].props.client_x ?? 0));
    }
}
