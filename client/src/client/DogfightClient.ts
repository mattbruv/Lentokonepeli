import { ChatMessage } from "dogfight-types/ChatMessage";
import { EntityChange } from "dogfight-types/EntityChange";
import { EntityProperties } from "dogfight-types/EntityProperties";
import { PlaneType } from "dogfight-types/PlaneType";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { Team } from "dogfight-types/Team";
import * as PIXI from "pixi.js";
import { IntlShape } from "react-intl";
import { Entity, isFollowable } from "./entities/entity";
import { Player } from "./entities/player";
import { DEFAULT_ENTITIES, deleteEntity, destroyEntities, entityCollection, upsertEntity } from "./EntityManager";
import { formatName } from "./helpers";
import { GameHUD } from "./hud";
import { GameKeyboard } from "./keyboard";
import { KillFeed } from "./killfeed";
import { RenderClient } from "./RenderClient";
import { RunwaySelector } from "./runwaySelector";
import { TeamChooser } from "./teamChooser";
import { Textures } from "./textures";

export type GameClientCallbacks = {
    chooseTeam: (team: Team | null) => void;
    chooseRunway: (runwayId: number, planeType: PlaneType, doTakeoff: boolean) => void;
    keyChange: (keyboard: PlayerKeyboard) => void;
    onPlayerChange: (playerData: PlayerProperties[]) => void;
    onMessage: (message: ChatMessage) => void;
};

function createNewPlayer(this: DogfightClient) {
    return new Player((oldControlling, newControlling, props) => {
        if (oldControlling) {
            if (oldControlling.type === "Plane") {
                this.entities.Plane.collection.get(oldControlling.data)?.setPlayerName(null, null);
            }
            if (oldControlling.type === "Man") {
                this.entities.Man.collection.get(oldControlling.data)?.setPlayerName(null, null);
            }
        }

        if (newControlling && newControlling) {
            const myTeam = this.getMyPlayer()?.props.team ?? null;
            const name = props.name?.substring(0, 15) ?? "";
            const fullName = formatName(name, props.clan ?? null);

            if (newControlling.type === "Plane") {
                this.entities.Plane.collection.get(newControlling.data)?.setPlayerName(fullName, myTeam);
            } else if (newControlling.type === "Man") {
                this.entities.Man.collection.get(newControlling.data)?.setPlayerName(fullName, myTeam);
            }
        }
    });
}

export class DogfightClient {
    private sky: PIXI.TilingSprite;

    private myPlayerGuid: string | null = null;
    private myPlayerId: number | null = null;

    private teamChooser: TeamChooser = new TeamChooser();
    private runwaySelector: RunwaySelector = new RunwaySelector();
    private gameHUD: GameHUD = new GameHUD();
    private killFeed: KillFeed = new KillFeed();
    public keyboard: GameKeyboard = new GameKeyboard();

    private callbacks?: GameClientCallbacks;
    private sendPlayerUpdate: boolean = false;
    public entities = entityCollection([...DEFAULT_ENTITIES, ["Player", createNewPlayer.bind(this)]]);
    public renderClient: RenderClient;

    constructor() {
        const skyTexture = Textures["sky3b.jpg"];

        this.sky = new PIXI.TilingSprite(Textures["sky3b.jpg"]);
        this.sky.texture = skyTexture;
        this.sky.width = skyTexture.width;
        this.sky.height = skyTexture.height;

        this.sky.position.set(0, -250);

        const containers = [this.killFeed.container, this.runwaySelector.container, this.teamChooser.container];

        this.renderClient = new RenderClient({ background: this.sky, containers, hud: this.gameHUD.container });
    }

    // Handle key events and dispatch the proper callback calls
    // based on our current player's state
    private onKeyChange(keys: PlayerKeyboard, type: "up" | "down") {
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
                        type,
                        keys,
                        this.entities.Runway,
                        (runwayPos) => {
                            this.centerCamera(runwayPos.x, runwayPos.y);
                        },
                        (runwayId, planeType, doTakeoff) => {
                            this.callbacks?.chooseRunway(runwayId, planeType, doTakeoff);
                        },
                    );
                }
                break;
            }
        }
    }

    public init(callbacks: GameClientCallbacks, element: HTMLDivElement, intl: IntlShape) {
        element?.appendChild(this.renderClient.app.view);

        this.callbacks = callbacks;
        this.teamChooser.init(this.callbacks);
        this.runwaySelector.init(this.callbacks, intl);
        this.keyboard.init((keyboard, type) => this.onKeyChange(keyboard, type));
        this.gameHUD.init();
        this.killFeed.init();

        const width = this.renderClient.app.screen.width / 2;
        const height = this.renderClient.app.screen.height / 2;
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
            const y = this.renderClient.app.screen.height - this.gameHUD.container.height;
            this.gameHUD.container.position.set(0, y);
        }

        // Set KillFeed area
        {
            this.killFeed.container.position.set(510, 0);
        }

        // set runway selector
        {
            const w = this.runwaySelector.container.width;
            const h = this.runwaySelector.container.height;
            const x = width - w / 2;
            // idk why i have to divide hud height by 2, but thats what works
            const y = height - h / 2 - this.gameHUD.container.height / 2;
            this.runwaySelector.container.position.set(x, y);
        }

        this.centerCamera(0, 0);
    }

    public destroy() {
        console.log("destroying client...");
        destroyEntities(this.entities, {
            onRemove: this.onEntityRemoved.bind(this),
        });

        this.renderClient.app.destroy(true, {
            children: true,
        });
    }

    public setMyPlayerGuid(guid: string) {
        console.log("MY GUID", guid);
        this.myPlayerGuid = guid;
    }

    public setMyPlayerId(id: number) {
        this.myPlayerId = id;
    }

    private onJoinTeam(team: Team) {
        this.teamChooser.container.visible = false;
        this.gameHUD.setTeam(team);
        this.killFeed.setTeam(team);
    }

    public getMyPlayer(): Player | undefined {
        if (this.myPlayerId === null) return undefined;
        const myPlayer = this.entities.Player.collection.get(this.myPlayerId);
        return myPlayer;
    }

    private onMyPlayerUpdate(props: PlayerProperties) {
        const myPlayer = this.getMyPlayer();
        if (!myPlayer) return;

        // If we're controlling the runway,
        // this means we just landed and we want to center on the runway
        if (props.controlling?.type === "Runway") {
            const runway = this.entities.Runway.collection.get(props.controlling.data[0]);

            if (runway) {
                this.followEntity(runway);
            }
        }

        if (props.runway_selection !== undefined) {
            this.runwaySelector.setSelection(props.runway_selection, this.entities.Runway);
        }

        if (props.team) {
            this.runwaySelector.setTeam(props.team);

            // update runway team colors
            for (const [_, runway] of this.entities.Runway.collection) {
                runway.setUserTeam(props.team);
            }

            for (const [_, bunker] of this.entities.Bunker.collection) {
                bunker.setUserTeam(props.team);
            }

            // update plane/man colors
            for (const [_, player] of this.entities.Player.collection) {
                if (player.props.controlling?.type === "Plane") {
                    this.entities.Plane.collection
                        .get(player.props.controlling.data)
                        ?.setPlayerName(player.props.name, props.team);
                }
                if (player.props.controlling?.type === "Man") {
                    this.entities.Man.collection
                        .get(player.props.controlling.data)
                        ?.setPlayerName(player.props.name, props.team);
                }
            }
        }

        switch (props.state) {
            case "ChoosingRunway": {
                this.runwaySelector.container.visible = true;
                this.runwaySelector.selectRunway(this.entities.Runway, (runwayPos) => {
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
        this.renderClient.centerCamera(x, y);
        this.gameHUD.radar.centerCamera(-x, -y);
    }

    private updateRadar() {
        this.gameHUD.radar.refreshRadar([
            this.entities.Ground,
            this.entities.Man,
            this.entities.Plane,
            this.entities.Runway,
            this.entities.Bunker,
        ]);
    }

    public handleGameEvents(events: ServerOutput[]) {
        this.sendPlayerUpdate = false;
        for (const event of events) {
            switch (event.type) {
                case "EntityChanges": {
                    this.updateEntities(event.data);
                    break;
                }
                case "PlayerJoin": {
                    this.sendPlayerUpdate = true;
                    console.log(event.data + " joined the game!");
                    break;
                }
                case "PlayerLeave": {
                    this.sendPlayerUpdate = true;
                    console.log(event.data + " left the game!");
                    break;
                }
                case "PlayerJoinTeam": {
                    this.sendPlayerUpdate = true;
                    const player = this.entities.Player.collection.get(event.data.id);
                    if (player) {
                        console.log(event.data.id + " joined " + event.data.team);
                        if (event.data.id === this.myPlayerId) {
                            this.onJoinTeam(event.data.team);
                        }
                    }
                    break;
                }
                case "KillEvent": {
                    this.sendPlayerUpdate = true;
                    const killer_data = this.entities.Player.collection.get(event.data.killer);
                    const victim_data =
                        event.data.victim !== null
                            ? (this.entities.Player.collection.get(event.data.victim) ?? null)
                            : null;

                    if (killer_data) {
                        this.killFeed.addKillEvent({
                            ...event.data,
                            killer_data,
                            victim_data,
                        });
                    }

                    break;
                }
                case "YourPlayerGuid": {
                    this.sendPlayerUpdate = true;
                    this.setMyPlayerGuid(event.data);
                    break;
                }
                case "ChatMessage": {
                    this.callbacks?.onMessage(event.data);
                    break;
                }
                default: {
                    // Exhaustive check
                    const _: never = event;
                }
            }
        }

        if (this.sendPlayerUpdate) {
            this.callbacks?.onPlayerChange(this.getPlayerData());
        }

        this.sendPlayerUpdate = false;
    }

    private updateEntities(changes: EntityChange[]) {
        for (const change of changes) {
            const { ent_type, id, update } = change;

            switch (update.type) {
                case "Deleted": {
                    deleteEntity(this.entities, id, ent_type, {
                        onRemove: this.onEntityRemoved.bind(this),
                    });
                    break;
                }
                case "Properties": {
                    upsertEntity(this.entities, id, update.data, {
                        onAdd: this.onEntityAdded.bind(this),
                        onUpdate: this.onEntityUpdated.bind(this),
                    });
                }
            }
        }

        this.updateRadar();
    }

    private onEntityUpdated(entity: Entity<unknown>, id: number, data?: EntityProperties) {
        const me = this.getMyPlayer();

        if (me?.props.controlling) {
            if (id === me.props.controlling.data && data?.type === me.props.controlling.type) {
                this.followEntity(entity);
            }
        }

        if (data?.type === "Player") {
            this.sendPlayerUpdate = true;
            const { guid } = data.props;

            if (guid !== undefined && guid === this.myPlayerGuid) {
                this.myPlayerId = id;
            }

            if (this.myPlayerId === id) {
                this.onMyPlayerUpdate(data.props);
            }
        }
    }

    private followEntity(entity: Entity<unknown>) {
        if (isFollowable(entity)) {
            const pos = entity.getCenter();
            this.renderClient.debugCoords.text = `${pos.x}, ${pos.y}`;
            this.centerCamera(pos.x, pos.y);
            this.gameHUD.updateStats(entity.getStats());
        }
    }

    private onEntityAdded(entity: Entity<unknown>) {
        this.renderClient.addEntity(entity);
    }

    private onEntityRemoved(entity: Entity<unknown>) {
        this.renderClient.removeEntity(entity);
    }

    private getPlayerData(): PlayerProperties[] {
        return [...this.entities.Player.collection.entries().map(([_id, player]) => player.props)];
    }
}
