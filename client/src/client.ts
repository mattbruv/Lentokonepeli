import { spriteSheet } from "./render/textures";
import { GameWorld } from "../../dogfight/src/world";
import { GameRenderer } from "./render/renderer";
import { CanvasEventHandler } from "./render/event";
import { Localizer } from "./localization/localizer";
import { Packet, PacketType } from "../../dogfight/src/network/types";
import { pack, unpack } from "../../dogfight/src/network/packer";
import { GameInput } from "./input";
import { ClientMode, TeamSelect } from "./types";
import { InputKey } from "../../dogfight/src/constants";

const wssPath = "ws://" + location.host;

export class GameClient {
  /**
   * WebSocket connection
   */
  private ws: WebSocket;

  /**
   * A local instance of the Dogfight Engine.
   * This is helpful for processing entity
   * movement between state updates
   * (client side prediction)
   */
  private localWorld: GameWorld;

  /**
   * A local instance of the Dogfight Renderer.
   * This takes game changes and renders a world
   * based on those changes.
   */
  private localRenderer: GameRenderer;

  private canvasHandler: CanvasEventHandler;

  private input: GameInput;

  private mode: ClientMode;
  private teamSelection: TeamSelect;

  public constructor() {
    console.log("Initializing Game Client..");
    this.localWorld = new GameWorld();
    // this.localWorld.loadMap(MAP_CLASSIC);
    // create renderer
    this.localRenderer = new GameRenderer(spriteSheet);

    // create canvas event handler
    this.canvasHandler = new CanvasEventHandler(this.localRenderer);
    this.canvasHandler.addListeners();

    // Add event listeners for input
    this.input = new GameInput();
    document.addEventListener("keydown", (event): void => {
      this.keyDown(event);
    });

    // center camera
    this.localRenderer.centerCamera(0, 0);

    // Draw it to the screen
    const div = document.getElementById("app");
    div.appendChild(this.localRenderer.getView());

    this.setMode(ClientMode.SelectTeam);
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

  private setMode(mode: ClientMode): void {
    this.mode = mode;
    this.localRenderer.setMode(mode);
  }

  private keyDown(event: KeyboardEvent): void {
    if (!this.input.isGameKey(event)) {
      return;
    }
    const key = this.input.getGameKey(event);
    /*
    if (this.mode === ClientMode.SelectTeam) {
      let offset = 0;
      if (key == InputKey.Left) {
        offset = -1;
      }
      if (key == InputKey.Right) {
        offset = 1;
      }

      const newSelection = (this.teamSelection + offset) % 3;
      console.log(-1 % 3);
      console.log(this.teamSelection, newSelection);
      this.teamSelection = newSelection;
      this.localRenderer.teamChooser.setSelection(newSelection);
    }*/
  }

  private processPacket(packet: Packet): void {
    const type = packet.type;
    //console.log(packet.data);
    if (type == PacketType.FullSync) {
      this.localRenderer.updateCache(packet.data);
      this.localRenderer.startGame();
    }
    if (type == PacketType.ChangeSync) {
      this.localRenderer.updateCache(packet.data);
    }
  }

  public updateLanguage(language: string): void {
    console.log("Changing language to", language);
    Localizer.setLanguage(language);
    this.localRenderer.updateLanguage();
  }
}
