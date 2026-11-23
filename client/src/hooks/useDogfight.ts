import { ChatMessage } from "dogfight-types/ChatMessage";
import { DebugEntity } from "dogfight-types/DebugEntity";
import { InspectEntity } from "dogfight-types/InspectEntity";
import { PlaneType } from "dogfight-types/PlaneType";
import { PlayerCommand } from "dogfight-types/PlayerCommand";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { Team } from "dogfight-types/Team";
import { WorldState } from "dogfight-types/WorldState";
import { DogfightWeb } from "dogfight-web";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { CameraState, DogfightClient, GameClientCallbacks } from "../client/DogfightClient";
import { ChatMessageTimed } from "../components/Chat";
import { randomGuid } from "../helpers";
import { useGameKeybinds } from "./keybinds/useGameKeybinds";
import { useSettingsContext } from "../contexts/settingsContext";
import { leaveActiveGame } from "./useActiveView";

export type DogfightCallbacks = {
    handleClientCommand: (command: PlayerCommand) => void;
};

export function useDogfight({ handleClientCommand }: DogfightCallbacks) {
    const intl = useIntl();
    const client = useMemo(() => new DogfightClient(), []);
    const engine = useMemo(() => DogfightWeb.new(), []);

    // Scoreboard related information
    const [playerData, setPlayerData] = useState<PlayerProperties[]>([]);
    const [playerGuid, setPlayerGuid] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessageTimed[]>([]);
    const [worldState, setWorldState] = useState<WorldState | null>(null);

    useGameKeybinds({ client, engine });
    const { settings, setSettings } = useSettingsContext();

    useEffect(() => {
        client.setSoundsChecked(!settings.audioSettings.muted);
    }, [client, settings.audioSettings.muted]);

    const handleGameEvents = useCallback(
        (events: ServerOutput[]): void => {
            client.handleGameEvents(events);
        },
        [client],
    );

    const setMyPlayerGuid = useCallback(
        (guid: string | null, replay: boolean): void => {
            setPlayerGuid(guid);
            client.setMyPlayerGuid(guid, replay);
        },
        [client],
    );

    function initialize(div: HTMLDivElement, startAudio = true) {
        // TODO: clean this up, just expose the onCommand directly in the client
        // and write out the command in the client
        const client_callbacks: GameClientCallbacks = {
            chooseTeam: (team: Team | null): void => {
                handleClientCommand({
                    type: "PlayerChooseTeam",
                    data: { team },
                });
            },
            chooseRunway: (runwayId: number, planeType: PlaneType): void => {
                handleClientCommand({
                    type: "PlayerChooseRunway",
                    data: {
                        plane_type: planeType,
                        runway_id: runwayId,
                    },
                });
            },
            keyChange: (keyboard: PlayerKeyboard): void => {
                handleClientCommand({
                    type: "PlayerKeyboard",
                    data: {
                        ...keyboard,
                    },
                });
            },
            onPlayerChange: (playerInfo: PlayerProperties[]): void => {
                setPlayerData(playerInfo);
            },
            onWorldStateChange: (state: WorldState | null): void => {
                setWorldState(state);
            },
            onExit: (): void => {
                leaveActiveGame();
                window.location.href = import.meta.env.BASE_URL;
            },
            onToggleSounds: (enabled: boolean): void => {
                setSettings((current) => ({
                    ...current,
                    audioSettings: { ...current.audioSettings, muted: !enabled },
                }));
            },
            onMessage: (message: ChatMessage): void => {
                const timedMessage: ChatMessageTimed = {
                    ...message,
                    isNewMessage: true,
                    guid: randomGuid(),
                };

                // stop displaying the message passively after 5 seconds
                setTimeout(() => {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.guid === timedMessage.guid
                                ? {
                                      ...timedMessage,
                                      isNewMessage: false,
                                  }
                                : msg,
                        ),
                    );
                }, 5000);

                setMessages((prev) => {
                    return [...prev, timedMessage];
                });
            },
        };

        client.init(client_callbacks, div, intl);
        if (startAudio) client.startAudio();
    }

    function startAudio() {
        client.startAudio();
    }

    function stopAudio() {
        client.stopAudio();
    }

    useEffect(() => {
        return () => {
            client.destroy();
            engine.free();
            document.onkeydown = null;
            document.onkeyup = null;
            console.log("UseDogfight hook destructor called.");
        };
    }, []);

    function drawCollisionTerrain() {
        client.renderClient.renderDebugTerrain(JSON.parse(engine.debug_terrain()) as DebugEntity[]);
    }

    function drawCollisionDynamic() {
        client.renderClient.renderDebug(JSON.parse(engine.debug_dynamic()) as DebugEntity[]);
    }

    function clearCollision() {
        client.renderClient.clearDebug();
    }

    function enableCameraControls(listener: (state: CameraState) => void) {
        client.enableCameraControls(listener);
    }

    function onPointerHover(callback: (screen: { x: number; y: number } | null) => void) {
        client.onPointerHover(callback);
    }

    function inspectAt(screen: { x: number; y: number }, radiusPx: number): InspectEntity[] {
        const world = client.screenToWorld(screen);
        const radius = Math.max(1, Math.round(radiusPx / client.getZoom()));
        const entities = JSON.parse(
            engine.inspect(Math.round(world.x), Math.round(world.y), radius),
        ) as InspectEntity[];
        client.highlightInspected(entities.map((entity) => entity.bounding_box));
        return entities;
    }

    function clearInspection() {
        client.highlightInspected([]);
    }

    function getCanvasScale() {
        return client.getCanvasScale();
    }

    function setFreeCamera(free: boolean) {
        client.setFreeCamera(free);
    }

    function setZoom(zoom: number) {
        client.setZoom(zoom);
    }

    function stepZoom(direction: 1 | -1) {
        client.stepZoom(direction);
    }

    function clearEntities() {
        client.clearEntities();
    }

    function setReplayMode() {
        client.setReplayMode();
    }

    function refreshView() {
        client.refreshMyView();
    }

    return {
        initialize,
        clearEntities,
        setReplayMode,
        refreshView,
        startAudio,
        stopAudio,
        drawCollisionTerrain,
        drawCollisionDynamic,
        clearCollision,
        enableCameraControls,
        onPointerHover,
        inspectAt,
        clearInspection,
        getCanvasScale,
        setFreeCamera,
        setZoom,
        stepZoom,
        handleGameEvents,
        setMyPlayerGuid,
        playerGuid,
        messages,
        playerData,
        intermission: worldState === "Intermission",
        worldState,
        engine,
    };
}
