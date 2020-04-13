import { spriteSheet, loadSpriteSheet } from "./render/textures";
import { GameRenderer } from "./render/renderer";
import { CanvasEventHandler } from "./render/event";
import { Localizer } from "./localization/localizer";
import { Packet, PacketType } from "../../dogfight/src/network/types";
import { InputHandler } from "./inputHandler";
import { ClientMode } from "./types";
import { CacheEntry } from "../../dogfight/src/network/cache";
import { GameObjectType } from "../../dogfight/src/object";
import { TeamSelector } from "./teamSelector";
import { Team } from "../../dogfight/src/constants";
import { TakeoffSelector } from "./takeoffSelector";
import { radarObjects } from "./render/objects/radar";
import { NetworkHandler } from "./networkHandler";
import { InputChange } from "../../dogfight/src/input";
import { PlayerStatus } from "../../dogfight/src/objects/player";

export class GameClient {
  private renderer: GameRenderer;

  private network: NetworkHandler;

  private input: InputHandler;
  private canvasHandler: CanvasEventHandler;

  public loadedGame: boolean = false;
  public mode: ClientMode = ClientMode.SelectTeam;

  // Client UI Logic classes
  private teamSelector: TeamSelector;
  private takeoffSelector: TakeoffSelector;

  public gameObjects: {};

  private playerInfo = {
    id: undefined,
    team: undefined
  };

  public followObject = {
    type: GameObjectType.None,
    id: undefined
  };

  public constructor() {
    // Initialize game object container
    this.gameObjects = {};
    for (const key in GameObjectType) {
      this.gameObjects[key] = {};
    }

    // instantiate client UI logic
    this.teamSelector = new TeamSelector();
    this.takeoffSelector = new TakeoffSelector();

    loadSpriteSheet((): void => {
      this.initRenderer();
    });
  }

  private initRenderer(): void {
    // initialize renderer stuff here
    // create renderer
    this.renderer = new GameRenderer(spriteSheet);

    // create canvas event handler
    this.canvasHandler = new CanvasEventHandler(this.renderer);
    this.canvasHandler.addListeners();

    // create network handler
    this.network = new NetworkHandler((data): void => {
      this.processPacket(data);
    });

    // center camera
    this.renderer.centerCamera(0, 150);

    // Draw it to the screen
    const div = document.getElementById("game");
    div.appendChild(this.renderer.getView());

    // update language
    this.updateLanguage(Localizer.getLanguage());

    // Add event listeners for input
    this.input = new InputHandler();
    this.input.processGameKeyChange = (change): void => {
      this.processGameInput(change);
    };
  }

  public getFollowObject(): any | undefined {
    return this.gameObjects[this.followObject.type][this.followObject.id];
  }

  private setMode(mode: ClientMode): void {
    this.mode = mode;
    this.renderer.setMode(mode);
    if (this.mode == ClientMode.SelectTeam) {
      this.renderer.teamChooserUI.setSelection(
        this.teamSelector.getSelection()
      );
      return;
    }
    if (this.mode == ClientMode.PreFlight) {
      this.takeoffSelector.setTeam(this.playerInfo.team);
      const runways = this.gameObjects[GameObjectType.Runway];
      this.takeoffSelector.updateRunways(runways, this.renderer, true);
      const plane = this.takeoffSelector.getPlaneSelection();
      this.renderer.takeoffSelectUI.setPlane(plane);
    }
    if (this.mode == ClientMode.Playing) {
      console.log("you are playing now!");
    }
  }

  private processGameInput(change: InputChange): void {
    switch (this.mode) {
      case ClientMode.SelectTeam: {
        this.teamSelector.processInput(change, this.renderer, this.network);
        break;
      }
      case ClientMode.PreFlight: {
        const runways = this.gameObjects[GameObjectType.Runway];
        this.takeoffSelector.updateRunways(runways, this.renderer, false);
        this.takeoffSelector.processInput(change, this.renderer, this.network);
        break;
      }
    }
    const packet: Packet = { type: PacketType.UserGameInput, data: change };
    this.network.send(packet);
  }

  private processPacket(packet: Packet): void {
    const type = packet.type;
    const data = packet.data;
    if (type == PacketType.FullSync) {
      this.processCache(data);
      if (this.loadedGame == false) {
        this.loadedGame = true;
        this.setMode(ClientMode.SelectTeam);
      }
    }
    if (type == PacketType.ChangeSync) {
      this.processCache(data);
    }
    if (type == PacketType.AssignPlayer) {
      console.log("Assigned as player", data.id, "team", Team[data.team]);
      this.playerInfo = {
        id: data.id,
        team: data.team
      };
      this.setMode(ClientMode.PreFlight);
      this.renderer.HUD.setTeam(data.team);
      this.renderer.HUD.radar.refreshRadar(this.gameObjects);
    }
  }

  private processCache(cache: Cache): void {
    for (const id in cache) {
      this.processEntry(cache[id], id);
    }
  }

  private getControllingPlayer(type: GameObjectType, objid: string): number {
    // check if this ia followed object.
    for (const id in this.gameObjects[GameObjectType.Player]) {
      const p = this.gameObjects[GameObjectType.Player][id];
      if (p.controlType == type && p.controlID == objid) {
        return parseInt(id);
      }
    }
    return -1;
  }

  private processEntry(entry: CacheEntry, id: string): void {
    const { type, ...data } = entry;
    // If the update data is empty, that is a signal
    // that the object has been deleted in the engine.
    if (Object.keys(data).length === 0) {
      this.deleteObject(type, id);
      return;
    }

    // create if not exists
    if (this.gameObjects[type][id] === undefined) {
      this.gameObjects[type][id] = {};
      console.log("Create", GameObjectType[type], id);
    }
    const object = this.gameObjects[type][id];

    // Otherwise, update the properties
    for (const key in data) {
      let value = data[key];
      object[key] = value;
    }
    // this.gameObjects[type].updated = Date.now();

    this.renderer.updateSprite(type, id, data);

    // If this a controlled object by some player, update the name position
    const controllerID = this.getControllingPlayer(type, id);
    if (controllerID >= 0) {
      // console.log(GameObjectType[type], id, "is controlled by", controllerID);
      const player = this.gameObjects[GameObjectType.Player][controllerID];
      this.renderer.playerInfo.setInfo(
        this.playerInfo.team,
        controllerID,
        player,
        object
      );
    }

    // check if this changes our radar, if so, update it too.
    if (radarObjects.includes(type)) {
      this.renderer.HUD.radar.refreshRadar(this.gameObjects);
    }

    // If the player is not following anything, don't display name.
    if (type == GameObjectType.Player) {
      if (object.controlType == GameObjectType.None) {
        this.renderer.playerInfo.deletePlayer(parseInt(id));
      }
    }

    // check if change to our player or followobject
    if (type == GameObjectType.Player && this.playerInfo.id == id) {
      // set following
      this.followObject = {
        type: object.controlType,
        id: object.controlID
      };
      const status = object.status;
      if (status !== undefined) {
        if (status == PlayerStatus.Playing) {
          this.setMode(ClientMode.Playing);
        }
        if (status == PlayerStatus.Takeoff) {
          this.setMode(ClientMode.PreFlight);
        }
      }
    }
    // If this is an update to our follow object,
    // update our HUD
    if (type == this.followObject.type && this.followObject.id == id) {
      const { x, y } = object;
      if (x !== undefined && y !== undefined) {
        this.renderer.centerCamera(x, y);
      }
      this.renderer.HUD.updateFollowObject(object);
    }
  }

  private deleteObject(type: number, id: string): void {
    if (this.followObject.type == type && this.followObject.id == id) {
      this.followObject = {
        type: GameObjectType.None,
        id: undefined
      };
    }
    if (type == GameObjectType.Player) {
      this.renderer.playerInfo.deletePlayer(parseInt(id));
    }
    delete this.gameObjects[type][id];
    this.gameObjects[type].updated = Date.now();
    this.renderer.deleteSprite(type, id);
    this.renderer.HUD.radar.refreshRadar(this.gameObjects);
  }

  public updateLanguage(language: string): void {
    console.log("Changing language to", language);
    Localizer.setLanguage(language);
    // update strings.
    this.renderer.updateLanguage();
    document.title = Localizer.get("gameName");
  }
}
