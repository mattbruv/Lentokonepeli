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
import { Entity, isFollowable, updateProps } from "./entities/entity";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import { toPixiPoint } from "./helpers";
import { RunwaySelection } from "dogfight-types/RunwaySelection";
import { RunwaySelector } from "./runwaySelector";
import { GameKeyboard } from "./keyboard";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { PlaneType } from "dogfight-types/PlaneType";
import { WorldInfo } from "./entities/worldInfo";
import { Plane } from "./entities/plane";
import { DebugEntity } from "dogfight-types/DebugEntity";
import { Bomb } from "./entities/bomb";
import { Explosion } from "./entities/explosion";

export type GameClientCallbacks = {
  chooseTeam: (team: Team | null) => void;
  chooseRunway: (runwayId: number, planeType: PlaneType) => void;
  keyChange: (keyboard: PlayerKeyboard) => void;
};

type EntityCollection = {
  [E in EntityProperties as E["type"]]: EntityGroup<Entity<E["props"]>>;
};

export type EntityGroup<T> = {
  new_type: () => T;
  entries: Map<number, T>;
};

export class DogfightClient {
  // https://pixijs.download/v7.x/docs/index.html
  private app: PIXI.Application<HTMLCanvasElement>;
  private viewport: Viewport;

  // Debugging helpers
  private debugPointer = new PIXI.Text();
  private debugCoords = new PIXI.Text();
  private debugCollision = new PIXI.Graphics();

  private myPlayerId: number | null = null;
  private myPlayerName: string | null = null;

  private teamChooser: TeamChooser = new TeamChooser();
  private runwaySelector: RunwaySelector = new RunwaySelector();
  private gameHUD: GameHUD = new GameHUD();
  public keyboard: GameKeyboard = new GameKeyboard();

  private debug: PIXI.Graphics = new PIXI.Graphics();

  private callbacks?: GameClientCallbacks;

  private worldInfo: EntityGroup<WorldInfo> = {
    new_type: () => new WorldInfo(),
    entries: new Map(),
  };

  private planes: EntityGroup<Plane> = {
    new_type: () => new Plane(),
    entries: new Map(),
  };

  private players: EntityGroup<Player> = {
    new_type: () => new Player(),
    entries: new Map(),
  };

  private grounds: EntityGroup<Ground> = {
    new_type: () => new Ground(),
    entries: new Map(),
  };

  private backgroundItems: EntityGroup<BackgroundItem> = {
    new_type: () => new BackgroundItem(),
    entries: new Map(),
  };

  private waters: EntityGroup<Water> = {
    new_type: () => new Water(),
    entries: new Map(),
  };

  private coasts: EntityGroup<Coast> = {
    new_type: () => new Coast(),
    entries: new Map(),
  };

  private runways: EntityGroup<Runway> = {
    new_type: () => new Runway(),
    entries: new Map(),
  };

  private bunkers: EntityGroup<Bunker> = {
    new_type: () => new Bunker(),
    entries: new Map(),
  };

  private bombs: EntityGroup<Bomb> = {
    new_type: () => new Bomb(),
    entries: new Map(),
  };

  private men: EntityGroup<Man> = {
    new_type: () => new Man(),
    entries: new Map(),
  };

  private explosions: EntityGroup<Explosion> = {
    new_type: () => new Explosion(),
    entries: new Map(),
  };

  private entities: EntityCollection = {
    WorldInfo: this.worldInfo,
    Plane: this.planes,
    Man: this.men,
    Player: this.players,
    BackgroundItem: this.backgroundItems,
    Ground: this.grounds,
    Coast: this.coasts,
    Runway: this.runways,
    Water: this.waters,
    Bunker: this.bunkers,
    Bomb: this.bombs,
    Explosion: this.explosions
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
      this.app.stage.addChild(this.debugPointer);
      this.app.stage.addChild(this.debugCoords);
      this.viewport.addChild(this.debugCollision);
      this.debugCollision.zIndex = 999;
      this.debugCoords.position.set(0, 30)
      this.debugPointer.style.fontFamily = "monospace";
      this.debugCoords.style.fontFamily = "monospace";

      this.viewport.onpointermove = (e) => {
        const pos = this.viewport.toWorld(e.data.global);
        const x = Math.round(pos.x);
        const y = Math.round(pos.y);
        this.debugPointer.text = `${x}, ${y}`;
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

    this.debug.beginFill("red");
    this.debug.drawCircle(0, 0, 10);
    this.debug.endFill;
    setTimeout(() => {
      this.viewport.addChild(this.debug);
    }, 100);
    this.centerCamera(0, 0);
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
    const myPlayer = this.players.entries.get(this.myPlayerId);
    return myPlayer;
  }

  private onMyPlayerUpdate(props: PlayerProperties) {
    console.log(props);
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
    const x1 = x - this.app.screen.width / 2;
    const y1 = y - (this.app.screen.height - this.gameHUD.container.height) / 2;
    //console.log(x, y, x1, y1);
    this.viewport.moveCorner(x1, y1);
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
          console.log(`DELETED: type ${ent_type} -> id ${id}`)
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
    const group = this.entities[ent_type];
    const entity = group.entries.get(id);
    if (!entity) return;
    this.viewport.removeChild(entity.getContainer())
    entity.destroy();
    group.entries.delete(id);
  }

  private updateEntity(id: number, data: EntityProperties) {
    const ent_map = this.entities[data.type];
    if (!ent_map) return;

    let entity = ent_map.entries.get(id);

    // If the entity doesn't exist, create a new one
    // and add it to the stage
    if (!entity) {
      entity = ent_map.new_type();
      if (entity) {
        // Not sure why Typescript wants to error when I call the set() function here.
        // It's making the set param a union type for some reason I don't understand
        ent_map.entries.set(id, entity as any);
        //console.log(id, ent_map.entries.size)
        this.viewport.addChild(entity.getContainer());
        console.log("create", data.type, "id:", id, "total:", ent_map.entries.size)
      }
    }

    if (entity) {
      updateProps(entity, data.props);

      const me = this.getMyPlayer();
      if (me) {
        if (me.props.controlling) {
          if (
            id === me.props.controlling.id &&
            data.type === me.props.controlling.entity_type
          ) {
            if (isFollowable(entity)) {
              //console.log("followable!");
              const pos = entity.getCenter();
              /*
              const pos = this.viewport.toWorld(e.data.global);
              const x = Math.round(pos.x);
              const y = Math.round(pos.y);
              */
              this.debugCoords.text = `${pos.x}, ${pos.y}`;
              this.centerCamera(pos.x, pos.y);
            }
          }
        }
      }

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

  public renderDebug(debugInfo: DebugEntity[]) {
    this.debugCollision.clear();
    this.viewport.sortChildren()

    for (const entry of debugInfo) {

      this.debugCollision.lineStyle({
        color: DEBUG_COLORS[entry.ent_type],
        width: 1,
      })

      const { x, y, width, height } = entry.bounding_box

      // console.log(entry)

      this.debugCollision.drawRect(x, y, width, height)

      if (entry.pixels) {
        for (const pixel of entry.pixels) {
          const px = x + pixel.x;
          const py = y + pixel.y;
          this.debugCollision.drawRect(px, py, 1, 1)
        }
      }
    }

    this.debugCollision.endFill()
  }
}


const DEBUG_COLORS: Record<EntityType, string> = {
  WorldInfo: "gray",
  Man: "magenta",
  Plane: "red",
  Player: "gray",
  BackgroundItem: "",
  Ground: "orange",
  Coast: "peru",
  Runway: "purple",
  Water: "blue",
  Bunker: "brown",
  Bomb: "black",
  Explosion: "lime"
}