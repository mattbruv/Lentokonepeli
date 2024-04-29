import * as PIXI from "pixi.js";
import { SKY_COLOR, VIEW_HEIGHT, VIEW_WIDTH } from "./constants";
import { Viewport } from "pixi-viewport";
import { Ground } from "./entities/ground";
import { Water } from "./entities/water";
import { EntityChange } from "dogfight-types/EntityChange";
import { EntityProperties } from "dogfight-types/EntityProperties";
import { EntityType } from "dogfight-types/EntityType";
import { loadTextures } from "./textures";
import { Coast } from "./entities/coast";
import { Runway } from "./entities/runway";
import { BackgroundItem } from "./entities/backgroundItem";
import { Bunker } from "./entities/bunker";
import { Man } from "./entities/man";
import { GameOutput } from "dogfight-types/GameOutput";
import { Player } from "./entities/player";
import { Team } from "dogfight-types/Team";
import { TeamChooser } from "./teamChooser";
import { GameHUD } from "./hud";
import { Entity, updateProps } from "./entities/entity";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import { toPixiPoint } from "./helpers";
import { RunwaySelection } from "dogfight-types/RunwaySelection";
import { RunwaySelector } from "./runwaySelector";
import { GameKeyboard } from "./keyboard";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { PlaneType } from "dogfight-types/PlaneType";

export type GameClientCallbacks = {
  chooseTeam: (team: Team) => void;
  chooseRunway: (runwayId: number, planeType: PlaneType) => void;
  keyChange: (keyboard: PlayerKeyboard) => void;
};

export type EntityMap<T extends Entity<any>> = {
  new_type: () => T;
  map: Map<number, T>;
};

export class DogfightClient {
  // https://pixijs.download/v7.x/docs/index.html
  private app: PIXI.Application<HTMLCanvasElement>;
  private viewport: Viewport;
  private debugText = new PIXI.Text();

  private myPlayerId: number | null = null;
  private myPlayerName: string | null = null;

  private teamChooser: TeamChooser = new TeamChooser();
  private runwaySelector: RunwaySelector = new RunwaySelector();
  private gameHUD: GameHUD = new GameHUD();
  public keyboard: GameKeyboard = new GameKeyboard();

  private callbacks?: GameClientCallbacks;

  private players: EntityMap<Player> = {
    new_type: () => new Player(),
    map: new Map(),
  };

  private grounds: EntityMap<Ground> = {
    new_type: () => new Ground(),
    map: new Map(),
  };

  private backgroundItems: EntityMap<BackgroundItem> = {
    new_type: () => new BackgroundItem(),
    map: new Map(),
  };

  private waters: EntityMap<Water> = {
    new_type: () => new Water(),
    map: new Map(),
  };

  private coasts: EntityMap<Coast> = {
    new_type: () => new Coast(),
    map: new Map(),
  };

  private runways: EntityMap<Runway> = {
    new_type: () => new Runway(),
    map: new Map(),
  };

  private bunkers: EntityMap<Bunker> = {
    new_type: () => new Bunker(),
    map: new Map(),
  };

  private men: EntityMap<Man> = {
    new_type: () => new Man(),
    map: new Map(),
  };

  private entityMaps: Record<EntityType, EntityMap<any> | undefined> = {
    WorldInfo: undefined,
    Plane: undefined,
    Man: this.men,
    Player: this.players,
    BackgroundItem: this.backgroundItems,
    Ground: this.grounds,
    Coast: this.coasts,
    Runway: this.runways,
    Water: this.waters,
    Bunker: this.bunkers,
  };

  constructor() {
    this.app = new PIXI.Application<HTMLCanvasElement>({
      backgroundColor: SKY_COLOR,
      width: VIEW_WIDTH,
      height: VIEW_HEIGHT,
    });

    this.viewport = new Viewport({
      events: this.app.renderer.events,
    });

    this.app.stage.addChild(this.viewport);
    this.app.stage.addChild(this.teamChooser.container);
    this.app.stage.addChild(this.runwaySelector.container);
    this.app.stage.addChild(this.gameHUD.container);

    this.viewport.drag().pinch().wheel().decelerate();

    if (import.meta.env.DEV) {
      this.app.stage.addChild(this.debugText);
      this.debugText.style.fontFamily = "monospace";

      this.viewport.onpointermove = (e) => {
        const pos = this.viewport.toWorld(e.data.global);
        const x = Math.round(pos.x);
        const y = Math.round(pos.y);
        this.debugText.text = `${x}, ${y}`;
      };
    }
  }

  // Handle key events and dispatch the proper callback calls
  // based on our current player's state
  private onKeyChange(keys: PlayerKeyboard) {
    const myPlayer = this.getMyPlayer();
    if (!myPlayer) return;
    switch (myPlayer.props.state) {
      case "Playing": {
        this.callbacks?.keyChange(keys);
        break;
      }
      case "ChoosingRunway": {
        if (myPlayer.props.team) {
          this.runwaySelector.processKeys(
            keys,
            this.runways,
            (runwayPos) => {
              this.centerCamera(runwayPos.x, runwayPos.y);
            },
            (runwayId, planeType) => {
              this.callbacks?.chooseRunway(runwayId, planeType);
            }
          );
        }
        break;
      }
    }
  }

  public async init(callbacks: GameClientCallbacks, element: HTMLDivElement) {
    await loadTextures();
    this.appendView(element);
    this.callbacks = callbacks;
    this.teamChooser.init(this.callbacks);
    this.runwaySelector.init(this.callbacks);
    this.keyboard.init((keyboard) => this.onKeyChange(keyboard));
    this.gameHUD.init();

    const width = this.app.screen.width / 2;
    const height = this.app.screen.height / 2;
    // center the team chooser on the screen
    {
      const chooserWidth = this.teamChooser.container.width;
      const chooserHeight = this.teamChooser.container.height;
      const x = width - chooserWidth / 2;
      const y = height - chooserHeight / 2;
      this.teamChooser.container.position.set(x, y);
    }

    // set HUD on screen properly
    {
      const y = this.app.screen.height - this.gameHUD.container.height;
      this.gameHUD.container.position.set(0, y);
    }

    // set runway selector
    {
      const w = this.runwaySelector.container.width;
      const h = this.runwaySelector.container.height;
      const x = width - w / 2;
      // idk why i have to divide hud height by 2, but thats what works
      const y = height - h / 2 - this.gameHUD.container.height / 2;
      //console.log(w, h, x, y);
      this.runwaySelector.container.position.set(x, y);
    }
  }

  private appendView(element: HTMLDivElement) {
    element?.appendChild(this.app.view);
  }

  public setMyPlayerName(name: string) {
    this.myPlayerName = name;
  }

  private onJoinTeam(team: Team) {
    this.teamChooser.container.visible = false;
    this.gameHUD.setTeam(team);
  }

  private getMyPlayer(): Player | undefined {
    if (this.myPlayerId === null) return undefined;
    const myPlayer = this.players.map.get(this.myPlayerId);
    return myPlayer;
  }

  private onMyPlayerUpdate(props: PlayerProperties) {
    const myPlayer = this.getMyPlayer();
    if (!myPlayer) return;

    if (props.team) {
      this.runwaySelector.setTeam(props.team);
    }

    switch (props.state) {
      case "ChoosingRunway": {
        this.runwaySelector.container.visible = true;
        this.runwaySelector.selectRunway(this.runways, (runwayPos) => {
          this.centerCamera(runwayPos.x, runwayPos.y);
        });
        break;
      }
      case "Playing": {
        this.runwaySelector.container.visible = false;
        break;
      }
    }
  }

  /**
   * Center the camera view on a specific (x, y) location
   * Coordinates must be in game world space.
   */
  private centerCamera(x: number, y: number): void {
    // console.log(x, y);
    let canvasHeight = this.app.screen.height;
    // account for HUD height
    //if (this.gameHUD.isEnabled()) {
    canvasHeight -= this.gameHUD.container.height;
    // this.HUD.radar.centerCamera(x, y);
    //}
    const canvasWidth = this.app.screen.width;
    const pos = toPixiPoint({ x: -x, y: -y });
    pos.x += Math.round(canvasWidth / 2);
    pos.y += Math.round(canvasHeight / 2);
    // console.log(pos.x, pos.y);
    this.viewport.moveCenter(pos.x, pos.y);
  }

  public handleGameEvents(events: GameOutput[]) {
    for (const event of events) {
      switch (event.type) {
        case "EntityChanges": {
          this.updateEntities(event.data);
          break;
        }
        case "PlayerJoin": {
          console.log(event.data + " joined the game!");
          break;
        }
        case "PlayerLeave": {
          console.log(event.data + " left the game!");
          break;
        }
        case "PlayerJoinTeam": {
          console.log(event.data.name + " joined " + event.data.team);
          if (event.data.name === this.myPlayerName) {
            this.onJoinTeam(event.data.team);
          }

          break;
        }
      }
    }
  }

  private updateEntities(changes: EntityChange[]) {
    for (const change of changes) {
      const { ent_type, id, update } = change;

      switch (update.type) {
        case "Deleted": {
          this.deleteEntity(id, ent_type);
          break;
        }
        case "Properties": {
          this.updateEntity(id, update.data);
        }
      }
    }
  }

  private deleteEntity(id: number, ent_type: EntityType) {
    const ent_map = this.entityMaps[ent_type];
    if (!ent_map) return;
    const entity = ent_map.map.get(id);
    entity?.destroy();
    ent_map.map.delete(id);
  }

  private updateEntity(id: number, data: EntityProperties) {
    const ent_map = this.entityMaps[data.type];
    if (!ent_map) return;

    let entity = ent_map.map.get(id);

    // If the entity doesn't exist, create a new one
    // and add it to the stage
    if (!entity) {
      entity = ent_map.new_type();
      if (entity) {
        ent_map.map.set(id, entity);
        this.viewport.addChild(entity.getContainer());
      }
    }

    if (entity) {
      updateProps(entity, data.props);

      if (data.type === "Player") {
        const name = data.props.name;

        if (name !== undefined && name === this.myPlayerName) {
          this.myPlayerId = id;
        }

        if (this.myPlayerId === id) {
          this.onMyPlayerUpdate(data.props);
        }
      }
    }
  }
}
