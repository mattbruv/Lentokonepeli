import { ChatMessage } from "dogfight-types/ChatMessage";
import { EntityChange } from "dogfight-types/EntityChange";
import { EntityProperties } from "dogfight-types/EntityProperties";
import { PlaneType } from "dogfight-types/PlaneType";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { Team } from "dogfight-types/Team";
import { WorldState } from "dogfight-types/WorldState";
import * as PIXI from "pixi.js";
import { IntlShape } from "react-intl";
import { Entity, isFollowable } from "./entities/entity";
import { Hill } from "./entities/hill";
import { Player } from "./entities/player";
import { DEFAULT_ENTITIES, deleteEntity, destroyEntities, entityCollection, upsertEntity } from "./EntityManager";
import { formatName } from "./helpers";
import { GameHUD, Stats } from "./hud";
import { GameKeyboard } from "./keyboard";
import { KillFeed } from "./killfeed";
import { RenderClient } from "./RenderClient";
import { RunwaySelector } from "./runwaySelector";
import { RespawnInfo } from "./respawnInfo";
import { RoundInfo } from "./roundInfo";
import { TeamChooser } from "./teamChooser";
import { Textures } from "./textures";
import { GAME_HEIGHT } from "./constants";
import { drawQuality } from "./drawQuality";
import { soundManager } from "./soundManager";
import { GAME_INTL } from "../intl/messages";

const SPECTATE_STYLE: Partial<PIXI.ITextStyle> = {
    fontFamily: "Arial",
    fontSize: 15,
    fontWeight: "bold",
    fill: 0xffff00,
};

const TEAM_CHOOSER_CAMERA = { x: 0, y: -150 };

const MAX_BOMBS: Record<PlaneType, number> = {
    Albatros: 0,
    Junkers: 5,
    Fokker: 0,
    Bristol: 0,
    Salmson: 5,
    Sopwith: 0,
};

function fullPlaneStats(planeType: PlaneType): Stats {
    return { health: 255, fuel: 255, ammo: 255, bombs: MAX_BOMBS[planeType] };
}

export type GameClientCallbacks = {
    chooseTeam: (team: Team | null) => void;
    chooseRunway: (runwayId: number, planeType: PlaneType) => void;
    keyChange: (keyboard: PlayerKeyboard) => void;
    onPlayerChange: (playerData: PlayerProperties[]) => void;
    onMessage: (message: ChatMessage) => void;
    onWorldStateChange: (state: WorldState | null) => void;
    onExit: () => void;
    onToggleSounds: (enabled: boolean) => void;
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
    private respawnInfo: RespawnInfo = new RespawnInfo();
    private roundInfo: RoundInfo = new RoundInfo();
    private worldState: WorldState | null = null;
    private isReplay = false;
    private spectateContainer = new PIXI.Container();
    private spectatingText = new PIXI.Text("", SPECTATE_STYLE);
    private followingText = new PIXI.Text("", SPECTATE_STYLE);
    public keyboard: GameKeyboard = new GameKeyboard();

    private callbacks?: GameClientCallbacks;
    private intl?: IntlShape;
    private sendPlayerUpdate: boolean = false;
    public entities = entityCollection([...DEFAULT_ENTITIES, ["Player", createNewPlayer.bind(this)]]);
    public renderClient: RenderClient;

    constructor() {
        const skyTexture = Textures["sky3b.jpg"];

        this.sky = new PIXI.TilingSprite(Textures["sky3b.jpg"]);
        this.sky.texture = skyTexture;
        this.sky.width = skyTexture.width;
        this.sky.height = skyTexture.height;

        const containers = [
            this.roundInfo.container,
            this.runwaySelector.container,
            this.teamChooser.container,
            this.respawnInfo.container,
            this.roundInfo.clockContainer,
            this.spectateContainer,
            this.killFeed.container,
        ];

        this.renderClient = new RenderClient({ background: this.sky, containers, hud: this.gameHUD.container });
    }

    // Handle key events and dispatch the proper callback calls
    // based on our current player's state
    private onKeyChange(keys: PlayerKeyboard) {
        const myPlayer = this.getMyPlayer();
        if (!myPlayer) return;
        if (this.worldState === "Intermission") {
            this.callbacks?.keyChange(keys);
            return;
        }
        switch (myPlayer.props.state) {
            case "Playing": {
                this.callbacks?.keyChange(keys);
                break;
            }
            case "ChoosingTeam": {
                if (!this.isReplay) {
                    this.teamChooser.processKeys(keys);
                }
                break;
            }
            case "ChoosingRunway": {
                if (myPlayer.props.team) {
                    this.runwaySelector.processKeys(
                        keys,
                        this.entities.Runway,
                        (runwayPos) => {
                            this.centerCamera(runwayPos.x, runwayPos.y);
                        },
                        (runwayId, planeType) => {
                            this.callbacks?.chooseRunway(runwayId, planeType);
                        },
                    );
                    this.gameHUD.updateStats(fullPlaneStats(this.runwaySelector.getSelectedPlaneType()));
                }
                break;
            }
        }
    }

    public init(callbacks: GameClientCallbacks, element: HTMLDivElement, intl: IntlShape) {
        element?.appendChild(this.renderClient.app.view);

        this.callbacks = callbacks;
        this.intl = intl;
        this.runwaySelector.init(this.callbacks, intl);
        this.keyboard.init((keyboard) => this.onKeyChange(keyboard));
        this.gameHUD.init(
            {
                onExit: () => this.callbacks?.onExit(),
                onToggleSounds: (enabled) => this.callbacks?.onToggleSounds(enabled),
                onToggleGfx: (enabled) => this.setHighQuality(enabled),
            },
            {
                exit: intl.formatMessage(GAME_INTL.hud_exit),
                sounds: intl.formatMessage(GAME_INTL.hud_sounds),
                gfx: intl.formatMessage(GAME_INTL.hud_gfx),
            },
        );
        this.killFeed.init();
        this.respawnInfo.init(intl);

        const screen = this.renderClient.app.screen;
        const centerX = Math.trunc(screen.width / 2);
        const centerY = Math.trunc(GAME_HEIGHT / 2);

        this.teamChooser.init(this.callbacks, screen.width, GAME_HEIGHT);

        this.gameHUD.container.position.set(0, GAME_HEIGHT);

        this.killFeed.container.position.set(510, 0);

        {
            const panel = Textures["selectionScreen.gif"];
            this.runwaySelector.container.position.set(
                centerX - Math.trunc(panel.width / 2),
                centerY - Math.trunc(panel.height / 2),
            );
        }

        this.respawnInfo.container.position.set(centerX, centerY);

        this.roundInfo.init(intl, screen.width, GAME_HEIGHT);

        {
            const ascent = PIXI.TextMetrics.measureFont(this.spectatingText.style.toFontString()).ascent;
            this.spectatingText.text = intl.formatMessage(GAME_INTL.spectating);
            this.spectatingText.position.set(540, 370 - ascent);
            this.followingText.position.set(540, 390 - ascent);
            this.spectateContainer.addChild(this.spectatingText);
            this.spectateContainer.addChild(this.followingText);
            this.spectateContainer.visible = false;
        }

        this.centerCamera(TEAM_CHOOSER_CAMERA.x, TEAM_CHOOSER_CAMERA.y);
        soundManager.startMotorLoop();
    }

    public clearEntities() {
        destroyEntities(this.entities, {
            onRemove: this.onEntityRemoved.bind(this),
        });
    }

    public destroy() {
        console.log("destroying client...");
        soundManager.stopMotorLoop();
        destroyEntities(this.entities, {
            onRemove: this.onEntityRemoved.bind(this),
        });

        this.renderClient.app.destroy(true, {
            children: true,
        });
    }

    public setReplayMode() {
        this.isReplay = true;
        this.refreshOverlays();
    }

    public setMyPlayerGuid(guid: string | null, replay: boolean) {
        console.log("My guid:", guid);
        this.myPlayerGuid = guid;
        const myPlayer = this.entities.Player.collection.entries().find((x) => x[1].props.guid === guid);
        this.myPlayerId = myPlayer?.[0] ?? null;
        this.isReplay = replay;
        this.refreshSpectating();
        if (replay) {
            this.applyMyTeam(myPlayer?.[1].props.team ?? null);
            this.refreshMyView();
        }
    }

    public refreshMyView() {
        const me = this.getMyPlayer();
        if (!me) return;

        this.onMyPlayerUpdate(me.props);

        const controlling = me.props.controlling;
        if (controlling?.type === "Plane") {
            const plane = this.entities.Plane.collection.get(controlling.data);
            if (plane) this.followEntity(plane);
        }
        if (controlling?.type === "Man") {
            const man = this.entities.Man.collection.get(controlling.data);
            if (man) this.followEntity(man);
        }
    }

    private onJoinTeam(team: Team) {
        this.teamChooser.container.visible = false;
        this.applyMyTeam(team);
    }

    private applyMyTeam(team: Team | null) {
        this.gameHUD.setTeam(team ?? undefined);
        this.killFeed.setTeam(team);
        this.refreshTeamScores();
    }

    private refreshTeamScores() {
        for (const [_, worldInfo] of this.entities.WorldInfo.collection) {
            const myTeam = this.getMyPlayer()?.props.team ?? null;
            this.gameHUD.updateTeamScores(worldInfo.props.centrals_score, worldInfo.props.allies_score, myTeam);
        }
    }

    private onWorldInfoUpdate() {
        for (const [_, worldInfo] of this.entities.WorldInfo.collection) {
            const { state, winner, time_left } = worldInfo.props;
            if (state !== this.worldState) {
                this.worldState = state;
                this.callbacks?.onWorldStateChange(state);
                if (state === "PostGame") {
                    this.pushNotice(this.roundInfo.getWinnerMessage(winner), winner);
                }
            }
            this.roundInfo.setTimeLeft(time_left);
        }
        this.refreshTeamScores();
        this.refreshOverlays();
    }

    private refreshSpectating() {
        const me = this.getMyPlayer();
        this.spectateContainer.visible = this.isReplay;
        this.followingText.text = me
            ? (this.intl?.formatMessage(GAME_INTL.following, { name: formatName(me.props.name, me.props.clan) }) ?? "")
            : "";
    }

    private refreshOverlays() {
        const me = this.getMyPlayer();
        const intermission = this.worldState === "Intermission";
        let winner: Team | null = null;
        for (const [_, worldInfo] of this.entities.WorldInfo.collection) {
            winner = worldInfo.props.winner;
        }

        this.roundInfo.update(this.worldState, winner, me?.props.ready ?? true);
        this.refreshSpectating();
        this.teamChooser.container.visible =
            !intermission && !this.isReplay && (!me || me.props.state === "ChoosingTeam");
        this.runwaySelector.container.visible = !intermission && me?.props.state === "ChoosingRunway";

        if (!intermission && me?.props.state === "WaitingRespawn") {
            this.respawnInfo.show(me.props.respawn_seconds, me.props.respawn_type);
        } else {
            this.respawnInfo.hide();
        }
    }

    private pushNotice(message: string, team: Team | null) {
        this.callbacks?.onMessage({ sender_name: null, team, private: false, message });
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
            const [runwayId, planeType] = props.controlling.data;
            const runway = this.entities.Runway.collection.get(runwayId);

            if (runway) {
                const target = this.runwaySelector.getCameraTarget(runway, true);
                this.centerCamera(target.x, target.y);
            }
            this.gameHUD.updateStats(fullPlaneStats(planeType));
        }

        if (props.state === "ChoosingTeam") {
            this.teamChooser.reset();
            this.centerCamera(TEAM_CHOOSER_CAMERA.x, TEAM_CHOOSER_CAMERA.y);
        }

        if ("team" in props) {
            this.applyMyTeam(myPlayer.props.team);
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

        if (props.state === "ChoosingRunway") {
            if (myPlayer.props.last_runway !== null) {
                this.runwaySelector.preferRunway(this.entities.Runway, myPlayer.props.last_runway);
            }
            this.runwaySelector.selectRunway(this.entities.Runway, (runwayPos) => {
                this.centerCamera(runwayPos.x, runwayPos.y);
            });
            this.gameHUD.updateStats(fullPlaneStats(this.runwaySelector.getSelectedPlaneType()));
        }

        this.refreshOverlays();
    }

    /**
     * Center the camera view on a specific (x, y) location
     * Coordinates must be in game world space.
     */
    private centerCamera(x: number, y: number): void {
        this.renderClient.centerCamera(x, y);
        this.gameHUD.radar.centerCamera(-x, -y);
        this.applyParallax();
    }

    private updateRadar() {
        this.gameHUD.radar.refreshRadar([
            this.entities.Ground,
            this.entities.Man,
            this.entities.Plane,
            this.entities.Runway,
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
                    this.setMyPlayerGuid(event.data, false);
                    break;
                }
                case "ChatMessage": {
                    this.callbacks?.onMessage(event.data[1]);
                    break;
                }
                case "RunwayDestroyed": {
                    const message = this.intl?.formatMessage(GAME_INTL.runway_destroyed, { team: event.data });
                    if (message) this.pushNotice(message, event.data);
                    break;
                }
                case "HeadquartersDestroyed": {
                    const message = this.intl?.formatMessage(GAME_INTL.headquarters_destroyed, { team: event.data });
                    if (message) this.pushNotice(message, event.data);
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

        if (data?.type === "WorldInfo") {
            this.onWorldInfoUpdate();
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
        if (entity instanceof Hill) {
            entity.setCameraOffset(this.renderClient.cameraOffsetX, this.renderClient.cameraOffsetY);
            entity.setVisible(drawQuality.high);
        }
    }

    public setSoundsChecked(checked: boolean) {
        this.gameHUD.setSoundsChecked(checked);
    }

    private setHighQuality(high: boolean) {
        drawQuality.high = high;
        this.sky.visible = high;
        this.runwaySelector.setHighQuality(high);
        for (const [_, hill] of this.entities.Hill.collection) {
            hill.setVisible(high);
        }
    }

    private applyParallax() {
        for (const [_, hill] of this.entities.Hill.collection) {
            hill.setCameraOffset(this.renderClient.cameraOffsetX, this.renderClient.cameraOffsetY);
        }
    }

    private onEntityRemoved(entity: Entity<unknown>) {
        this.renderClient.removeEntity(entity);
    }

    private getPlayerData(): PlayerProperties[] {
        return [...this.entities.Player.collection.entries().map(([_id, player]) => player.props)];
    }
}
