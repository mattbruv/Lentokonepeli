import * as PIXI from "pixi.js";
import { Textures } from "./textures";
import { EntityMap, GameClientCallbacks } from "./DogfightClient";
import { PlaneType } from "dogfight-types/PlaneType";
import { Team } from "dogfight-types/Team";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { Runway } from "./entities/runway";

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
  }

  processKeys(keys: PlayerKeyboard) {
    const map = this.planeMap[this.team];
    if (keys.left || keys.down) {
      this.index = this.index - 1 < 0 ? map.length - 1 : this.index - 1;
    }
    if (keys.right || keys.up) {
      this.index = this.index + 1 >= map.length ? 0 : this.index + 1;
    }
    this.planeImage.texture = map[this.index].texture;
  }
}
