import { spriteSheet } from "./render/textures";
import { GameRenderer } from "./render/renderer";
import { CanvasEventHandler } from "./render/event";
import { Localizer } from "./localization/localizer";
import { Packet, PacketType } from "../../dogfight/src/network/types";
import { pack, unpack } from "../../dogfight/src/network/packer";
import { GameInput } from "./input";
import { ClientMode, TeamSelect, GameObjectIdentifier } from "./types";
import { CacheEntry } from "../../dogfight/src/network/cache";
import { GameObjectType } from "../../dogfight/src/object";

const wssPath = "ws://" + location.host;

export class GameClient {
  /**
   * WebSocket connection
   */
  private ws: WebSocket;

  private renderer: GameRenderer;

  private input: GameInput;
  private canvasHandler: CanvasEventHandler;

  private mode: ClientMode;
  private teamSelection: TeamSelect;

  private gameObjects = {};
  private watching = {
    type: undefined,
    id: undefined
  };

  public constructor() {
    // create renderer
    this.renderer = new GameRenderer(spriteSheet);

    // create canvas event handler
    this.canvasHandler = new CanvasEventHandler(this.renderer);
    this.canvasHandler.addListeners();

    // Add event listeners for input
    this.input = new GameInput();
    document.addEventListener("keydown", (event): void => {
      this.keyDown(event);
    });

    // center camera
    this.renderer.centerCamera(0, 0);

    // Draw it to the screen
    const div = document.getElementById("app");
    div.appendChild(this.renderer.getView());

    // Initialize game object container
    this.gameObjects = {};
    for (const key in GameObjectType) {
      this.gameObjects[key] = {};
    }

    this.teamSelection = TeamSelect.Random;

    // create connection to server.
    this.ws = new WebSocket(wssPath);

    this.ws.onopen = (): void => {
      this.ws.send(pack({ type: PacketType.RequestFullSync }));
    };

    this.ws.onmessage = (event): void => {
      const packet = unpack(event.data);
      this.processPacket(packet);
    };
  }

  private keyDown(event: KeyboardEvent): void {
    if (!this.input.isGameKey(event)) {
      return;
    }
    const key = this.input.getGameKey(event);
  }

  private processPacket(packet: Packet): void {
    const type = packet.type;
    if (type == PacketType.FullSync) {
      // this.localRenderer.updateCache(packet.data);
      // this.localRenderer.startGame();
      this.processCache(packet.data);
    }
    if (type == PacketType.ChangeSync) {
      this.processCache(packet.data);
      // this.localRenderer.updateCache(packet.data);
    }
  }

  private processCache(cache: Cache): void {
    for (const id in cache) {
      this.processEntry(cache[id], id);
    }
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
    }
    const object = this.gameObjects[type][id];

    // Otherwise, update the properties
    for (const key in data) {
      let value = data[key];
      object[key] = value;
    }

    this.renderer.updateSprite(type, id, data);

    if (type == GameObjectType.Trooper) {
      // this.watching = { type, id };
    }

    /*
    if (this.watching.id == id) {
      const { x, y } = this.gameObjects[type][id];
      if (x !== undefined && y !== undefined) {
        this.renderer.centerCamera(x, y);
      }
    }*/
  }

  private deleteObject(type: number, id: string): void {
    delete this.gameObjects[type][id];
    this.renderer.deleteSprite(type, id);
  }

  public updateLanguage(language: string): void {
    console.log("Changing language to", language);
    Localizer.setLanguage(language);
    this.renderer.updateLanguage();
  }
}
