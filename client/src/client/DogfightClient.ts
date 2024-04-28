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
import { TeamChooser } from "./team_chooser";
import { GameHUD } from "./hud";
import { Entity, updateProps } from "./entities/entity";
import { PlayerProperties } from "dogfight-types/PlayerProperties";

export type GameClientCallbacks = {
  chooseTeam: (team: Team) => void;
};

type EntityMap<T extends Entity<any>> = {
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
  private gameHUD: GameHUD = new GameHUD();

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

  public async init(callbacks: GameClientCallbacks, element: HTMLDivElement) {
    await loadTextures();
    this.appendView(element);
    this.callbacks = callbacks;
    this.teamChooser.init(this.callbacks);
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

  private onMyPlayerUpdate(props: PlayerProperties) {
    if (this.myPlayerId === null) return;
    const myPlayer = this.players.map.get(this.myPlayerId);
    if (!myPlayer) return;

    if (props.state === "ChoosingRunway") {
      const runways = [...this.runways.map.values()].filter(
        (x) => x.props.team === myPlayer.props.team
      );
      if (runways.length > 0) {
        const first = runways[0];
        const center = first.getCenter();
        console.log(center, first);
        this.centerCamera(center.x, center.y);
      }
    }
  }

  private centerCamera(x: number, y: number) {
    const hudHeight = this.gameHUD.container.height;
    y += hudHeight;
    this.viewport.moveCenter(x, y);
    console.log(x, y);
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
