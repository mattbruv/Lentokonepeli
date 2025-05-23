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

export class RunwaySelector {
    public container: PIXI.Container;

    public infoBox: PIXI.Sprite;
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
            fontWeight: "600",
        });
        this.planeDescriptionText = new PIXI.Text("", {
            fontFamily: "Arial",
            fontSize: 16,
            lineHeight: 24,
            fill: 0,
            wordWrap: true,
            wordWrapWidth: 280,
            fontWeight: "600",
        });

        this.container.addChild(this.infoBox);
        this.container.addChild(this.planeImage);
        this.container.addChild(this.planeNameText);
        this.container.addChild(this.planeDescriptionText);
        this.container.visible = false;

        this.planeImage.position.set(10);
        this.planeNameText.position.set(11, 138);
        this.planeDescriptionText.position.set(14, 171);

        this.planeMap = {
            Allies: [],
            Centrals: [],
        };
    }

    public init(callbacks: GameClientCallbacks, intl: IntlShape) {
        this.callbacks = callbacks;
        this.infoBox.texture = Textures["selectionScreen.gif"];

        this.planeMap.Centrals.push({
            plane_type: "Albatros",
            texture: Textures["pic_plane4.gif"],
            plane_name: intl.formatMessage(GAME_INTL.plane_name_Albatros),
            plane_description: intl.formatMessage(GAME_INTL.plane_description_Albatros),
        });

        this.planeMap.Centrals.push({
            plane_type: "Fokker",
            texture: Textures["pic_plane6.gif"],
            plane_name: intl.formatMessage(GAME_INTL.plane_name_Fokker),
            plane_description: intl.formatMessage(GAME_INTL.plane_description_Fokker),
        });

        this.planeMap.Centrals.push({
            plane_type: "Junkers",
            texture: Textures["pic_plane5.gif"],
            plane_name: intl.formatMessage(GAME_INTL.plane_name_Junkers),
            plane_description: intl.formatMessage(GAME_INTL.plane_description_Junkers),
        });

        this.planeMap.Allies.push({
            plane_type: "Bristol",
            texture: Textures["pic_plane7.gif"],
            plane_name: intl.formatMessage(GAME_INTL.plane_name_Bristol),
            plane_description: intl.formatMessage(GAME_INTL.plane_description_Bristol),
        });

        this.planeMap.Allies.push({
            plane_type: "Sopwith",
            texture: Textures["pic_plane9.gif"],
            plane_name: intl.formatMessage(GAME_INTL.plane_name_Sopwith),
            plane_description: intl.formatMessage(GAME_INTL.plane_description_Sopwith),
        });

        this.planeMap.Allies.push({
            plane_type: "Salmson",
            texture: Textures["pic_plane8.gif"],
            plane_name: intl.formatMessage(GAME_INTL.plane_name_Salmson),
            plane_description: intl.formatMessage(GAME_INTL.plane_description_Salmson),
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
        const pos = myRunways[this.runwayIndex][1].getCenter();
        pos.y -= 130;
        centerCamera(pos);
    }

    private getMyRunways(runways: EntityGroup<Runway>): [number, Runway][] {
        return [...runways.collection.entries()]
            .filter(
                ([_, runway]) => runway.props.team === this.team,
                // TODO: health
            )
            .sort((a, b) => (a[1].props.client_x ?? 0) - (b[1].props.client_x ?? 0));
    }
}
