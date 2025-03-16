import { DebugEntity } from "dogfight-types/DebugEntity";
import { PlaneType } from "dogfight-types/PlaneType";
import { PlayerCommand } from "dogfight-types/PlayerCommand";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { Team } from "dogfight-types/Team";
import { DogfightWeb } from "dogfight-web";
import { useEffect, useMemo, useState } from "react";
import { DogfightClient, GameClientCallbacks } from "../client/DogfightClient";
import { GameKey, getDefaultControls, useSettingsContext } from "../contexts/settingsContext";

export type DogfightCallbacks = {
    handleClientCommand: (command: PlayerCommand) => void;
};

export function useDogfight({ handleClientCommand }: DogfightCallbacks) {
    const client = useMemo(() => new DogfightClient(), []);
    const engine = useMemo(() => DogfightWeb.new(), []);

    const { settings } = useSettingsContext();
    const originalKeys = getDefaultControls();

    // Scoreboard related information
    const [playerData, setPlayerData] = useState<PlayerProperties[]>([]);
    const [playerGuid, setPlayerGuid] = useState<string | null>(null);
    const [showScoreboard, setShowScoreboard] = useState(false);

    function handleGameEvents(events: ServerOutput[]): void {
        client.handleGameEvents(events);
    }

    function setMyPlayerGuid(guid: string): void {
        setPlayerGuid(guid);
        client.setMyPlayerGuid(guid);
    }

    async function initialize(div: HTMLDivElement): Promise<void> {
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
        };

        await client.init(client_callbacks, div);

        // This is ghetto, but it works for now
        function mapBindingsToOldKey(key: string): string {
            //console.log(settings.settings.controls)
            // If this key is mapped, return the original key
            const entry = Object.entries(settings.controls).find(([_, keys]) => keys.includes(key));
            if (entry) {
                return originalKeys[entry[0] as GameKey].at(0)!;
            }
            return key;
        }

        document.onkeydown = (event) => {
            // Map the user's keybindings to the old keys
            const key = mapBindingsToOldKey(event.key);
            client.keyboard.onKeyDown(key, event);

            if (event.key === "Tab") {
                event.preventDefault();
                setShowScoreboard(true);
            }
        };
        document.onkeyup = (event) => {
            // Map the user's keybindings to the old keys
            const key = mapBindingsToOldKey(event.key);
            client.keyboard.onKeyUp(key, event);

            if (event.key === "Tab") {
                event.preventDefault();
                setShowScoreboard(false);
            }

            // pause/unpause the game
            if (event.key === "q") {
                //paused.current = !paused.current
            }

            if (event.key === "t") {
                //doTick.current = true
            }

            if (import.meta.env.DEV) {
                if (event.key === "d") {
                    const debugInfo: DebugEntity[] = JSON.parse(engine.debug());
                    client.renderDebug(debugInfo);
                }
            }
        };
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

    return {
        initialize,
        handleGameEvents,
        setMyPlayerGuid,
        showScoreboard,
        playerGuid,
        playerData,
        engine,
    };
}
