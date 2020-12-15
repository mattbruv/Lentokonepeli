import { spriteSheet, loadSpriteSheet } from "./render/textures";
import { GameRenderer } from "./render/renderer";
import { CanvasEventHandler } from "./render/event";
import { Localizer, Language } from "./localization/localizer";
import { Packet, PacketType } from "../../dogfight/src/network/types";
import { InputHandler } from "./inputHandler";
import { ClientMode } from "./types";
import { CacheEntry } from "../../dogfight/src/network/cache";
import { EntityType } from "../../dogfight/src/entity";
import { TeamSelector } from "./teamSelector";
import { Team, SCALE_FACTOR } from "../../dogfight/src/constants";
import { TakeoffSelector } from "./takeoffSelector";
import { radarObjects } from "./render/entities/radar";
import { NetworkHandler } from "./networkHandler";
import { InputChange } from "../../dogfight/src/input";
import { PlayerStatus } from "../../dogfight/src/entities/PlayerInfo";
import { AudioManager } from "./audio";
import { isNameValid } from "../../dogfight/src/validation";
import Cookies from "js-cookie";
import { moveBullet } from "../../dogfight/src/entities/Bullet";
import { loadImages } from "../../dogfight/src/images";

export class GameClient {
  private renderer: GameRenderer;

  private network: NetworkHandler;

  public input: InputHandler;
  private canvasHandler: CanvasEventHandler;

  public loadedGame: boolean = false;
  public mode: ClientMode = ClientMode.SelectTeam;

  private lastTick: number = 0;

  // Client UI Logic classes
  private teamSelector: TeamSelector;
  private takeoffSelector: TakeoffSelector;

  private audio: AudioManager;
  private images;

  public gameObjects: {};

  // strictly for vue, needs to know when
  // objects are updated.
  public playersUpdated: number = 0;

  public playerInfo = {
    id: undefined,
    team: undefined,
    name: undefined
  };

  public followObject = {
    type: EntityType.None,
    id: undefined
  };

  public constructor() {
    this.audio = new AudioManager();

    // Initialize game object container
    this.gameObjects = {};
    for (const key in EntityType) {
      this.gameObjects[key] = {};
    }

    // instantiate client UI logic
    this.teamSelector = new TeamSelector();
    this.takeoffSelector = new TakeoffSelector();

    loadSpriteSheet((): void => {
      loadImages("./assets/images/images.png").then((i) => {
        this.images = i;
        this.initRenderer();
      });
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
    }, this.images);

    // center camera
    this.renderer.centerCamera(0, 150);

    // Draw it to the screen
    const div = document.getElementById("game-canvas");
    div.appendChild(this.renderer.getView());

    // update language
    this.updateLanguage(Localizer.getLanguage());

    // Add event listeners for input
    this.input = new InputHandler();
    this.input.processGameKeyChange = (change): void => {
      this.processGameInput(change);
    };

    // register/start local movement calculations
    this.lastTick = Date.now();
    this.onAnimationFrame();
  }

  public onAnimationFrame(): void {
    const bullets = this.gameObjects[EntityType.Bullet];
    const now = Date.now();
    const deltaTime = now - this.lastTick;

    for (const index of Object.keys(bullets)) {
      const bullet = bullets[index];
      const vx = bullet.clientVX * SCALE_FACTOR;
      const vy = bullet.clientVY * SCALE_FACTOR;
      const x = bullet.x;
      const y = bullet.y;
      if (
        vx == undefined ||
        vy == undefined ||
        x == undefined ||
        y == undefined
      ) {
        return;
      }
      const localX = x * SCALE_FACTOR;
      const localY = y * SCALE_FACTOR;
      const newPos = moveBullet(localX, localY, vx, vy, deltaTime);
      const newX = Math.round(newPos.x / SCALE_FACTOR);
      const newY = Math.round(newPos.y / SCALE_FACTOR);
      bullet.x = newX;
      bullet.y = newY;
      // update sprite coords
      this.renderer.updateSprite(EntityType.Bullet, index, {
        x: newX,
        y: newY
      });
    }
    this.lastTick = now;

    window.requestAnimationFrame((): void => {
      this.onAnimationFrame();
    });
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
      const runways = this.gameObjects[EntityType.Runway];
      this.takeoffSelector.updateRunways(runways, this.renderer, true);
      const plane = this.takeoffSelector.getPlaneSelection();
      this.renderer.takeoffSelectUI.setPlane(plane);
    }
    if (this.mode == ClientMode.Playing) {
      // console.log("you are playing now!");
    }
  }

  private processGameInput(change: InputChange): void {
    switch (this.mode) {
      case ClientMode.SelectTeam: {
        this.teamSelector.processInput(change, this.renderer, this.network);
        break;
      }
      case ClientMode.PreFlight: {
        const runways = this.gameObjects[EntityType.Runway];
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
        window.setInterval((): void => {
          this.network.send({
            type: PacketType.Ping,
            data: {
              time: Date.now()
            }
          });
        }, 5000);
      }
    }
    if (type == PacketType.ChangeSync) {
      this.processCache(data);
    }
    if (type == PacketType.AssignPlayer) {
      console.log("Assigned as player", data.id, "team", Team[data.team]);
      console.log(data);

      this.playerInfo = {
        id: data.id,
        team: data.team,
        name: data.name
      };

      this.setMode(ClientMode.PreFlight);
      this.renderer.HUD.setTeam(data.team);
      this.renderer.HUD.radar.refreshRadar(this.gameObjects);
    }
  }

  private processCache(cache: Cache): void {
    for (const type in cache) {
      for (const id in cache[type]) {
        this.processEntry(cache[type][id], id);
      }
    }
  }

  private getControllingPlayer(type: EntityType, objid: string): number {
    // check if this ia followed object.
    for (const id in this.gameObjects[EntityType.Player]) {
      const p = this.gameObjects[EntityType.Player][id];
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
      // console.log("Create", GameObjectType[type], id);
      if (type == EntityType.Explosion) {
        this.audio.playExplosion();
      }
      if (type == EntityType.Bullet) {
        if (data.age == 0) {
          this.audio.playBullet();
        }
      } else if (type == EntityType.Bomb) {
        if (data.age == 0) {
          this.audio.playBomb();
        }
      }
    }
    const object = this.gameObjects[type][id];

    // Otherwise, update the properties
    for (const key in data) {
      let value = data[key];
      object[key] = value;
    }
    if (type == EntityType.Player) {
      this.playersUpdated = Date.now();
    }
    // this.gameObjects[type].updated = Date.now();

    this.renderer.updateSprite(type, id, data);

    // If this a controlled object by some player, update the name position
    const controllerID = this.getControllingPlayer(type, id);
    if (controllerID >= 0) {
      // console.log(GameObjectType[type], id, "is controlled by", controllerID);
      const player = this.gameObjects[EntityType.Player][controllerID];
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
    if (type == EntityType.Player) {
      if (object.controlType == EntityType.None) {
        this.renderer.playerInfo.deletePlayer(parseInt(id));
      }
    }

    // check if change to our player or followobject
    if (type == EntityType.Player && this.playerInfo.id == id) {
      // set following
      this.followObject = {
        type: object.controlType,
        id: object.controlID
      };
      if (object.name !== undefined) {
        this.playerInfo.name = object.name;
      }
      if (this.followObject.type == EntityType.Plane) {
        this.audio.playEngine(true);
      } else {
        this.audio.playEngine(false);
      }
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
        type: EntityType.None,
        id: undefined
      };
    }
    if (type == EntityType.Player) {
      this.renderer.playerInfo.deletePlayer(parseInt(id));
    }
    delete this.gameObjects[type][id];
    if (type == EntityType.Player) {
      this.playersUpdated = Date.now();
    }
    // this.gameObjects[type].updated = Date.now();
    this.renderer.deleteSprite(type, id);
    this.renderer.HUD.radar.refreshRadar(this.gameObjects);
  }

  public updateName(newName: string): void {
    if (isNameValid(newName)) {
      Cookies.set("name", newName, { expires: 9999 });
      console.log("updating name, sending packet");
      this.network.send({
        type: PacketType.ChangeName,
        data: {
          name: newName
        }
      });
    }
  }

  public updateLanguage(language: Language): void {
    console.log("Changing language to", language);
    Localizer.setLanguage(language);
    // update strings.
    this.renderer.updateLanguage();
    document.title = Localizer.get("gameName");
  }
}
