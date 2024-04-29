import * as PIXI from "pixi.js";
import { Textures } from "./textures";
import {
  DogfightClient,
  EntityMap,
  GameClientCallbacks,
} from "./DogfightClient";
import { PlaneType } from "dogfight-types/PlaneType";
import { Team } from "dogfight-types/Team";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { Runway } from "./entities/runway";
import { Point } from "./entities/entity";
import { Player } from "./entities/player";

type PlaneData = {
  plane_type: PlaneType;
  texture: PIXI.Texture;
};

type PlaneMap = Record<Team, PlaneData[]>;

export class RunwaySelector {
  public container: PIXI.Container;

  public infoBox: PIXI.Sprite;
  public planeImage: PIXI.Sprite;

  public planeMap: PlaneMap;
  private team: Team = "Centrals";
  private index = 0;
  private runwayIndex = 0;

  callbacks?: GameClientCallbacks;

  constructor() {
    this.container = new PIXI.Container();

    this.infoBox = new PIXI.Sprite();
    this.planeImage = new PIXI.Sprite();

    this.container.addChild(this.infoBox);
    this.container.addChild(this.planeImage);
    this.container.visible = false;

    this.planeImage.position.set(10);

    this.planeMap = {
      Allies: [],
      Centrals: [],
    };
  }

  public init(callbacks: GameClientCallbacks) {
    this.callbacks = callbacks;
    this.infoBox.texture = Textures["selectionScreen.gif"];

    this.planeMap.Centrals.push({
      plane_type: "Albatros",
      texture: Textures["pic_plane4.gif"],
    });

    this.planeMap.Centrals.push({
      plane_type: "Fokker",
      texture: Textures["pic_plane6.gif"],
    });

    this.planeMap.Centrals.push({
      plane_type: "Junkers",
      texture: Textures["pic_plane5.gif"],
    });

    this.planeMap.Allies.push({
      plane_type: "Bristol",
      texture: Textures["pic_plane7.gif"],
    });

    this.planeMap.Allies.push({
      plane_type: "Sopwith",
      texture: Textures["pic_plane9.gif"],
    });

    this.planeMap.Allies.push({
      plane_type: "Salmson",
      texture: Textures["pic_plane8.gif"],
    });

    this.planeImage.texture = Textures["pic_plane4.gif"];
  }

  setTeam(team: Team) {
    this.team = team;
    this.planeImage.texture = this.planeMap[this.team][this.index].texture;
  }

  processKeys(
    keys: PlayerKeyboard,
    runways: EntityMap<Runway>,
    centerCamera: (runwayPos: Point) => void,
    selectRunway: (runwayId: number, plane: PlaneType) => void
  ) {
    const map = this.planeMap[this.team];

    if (keys.down) {
      this.index = this.index - 1 < 0 ? map.length - 1 : this.index - 1;
    }

    if (keys.up) {
      this.index = this.index + 1 >= map.length ? 0 : this.index + 1;
    }

    this.planeImage.texture = map[this.index].texture;

    const myRunways = this.getMyRunways(runways);

    if (keys.left) {
      this.runwayIndex =
        this.runwayIndex - 1 < 0 ? myRunways.length - 1 : this.runwayIndex - 1;
    }

    if (keys.right) {
      this.runwayIndex =
        this.runwayIndex + 1 >= myRunways.length ? 0 : this.runwayIndex + 1;
    }

    this.selectRunway(runways, centerCamera);

    if (keys.enter) {
      const planeType = map[this.index].plane_type;
      const runwayId = myRunways[this.runwayIndex][0];
      selectRunway(runwayId, planeType);
    }
  }

  public selectRunway(
    runways: EntityMap<Runway>,
    centerCamera: (runwayPos: Point) => void
  ) {
    const myRunways = this.getMyRunways(runways);
    const pos = myRunways[this.runwayIndex][1].getCenter();
    centerCamera(pos);
  }

  private getMyRunways(runways: EntityMap<Runway>): [number, Runway][] {
    return [...runways.map.entries()]
      .filter(
        ([_, runway]) => runway.props.team === this.team
        // TODO: health
      )
      .sort((a, b) => (a[1].props.client_x ?? 0) - (b[1].props.client_x ?? 0));
  }
}
