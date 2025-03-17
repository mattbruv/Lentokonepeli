import { PlaneType } from "dogfight-types/PlaneType";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { Team } from "dogfight-types/Team";
import { DogfightWeb } from "dogfight-web";
import { useEffect, useMemo, useState } from "react";
import { DogfightClient, GameClientCallbacks } from "../client/DogfightClient";
import { PlayerCommand } from "dogfight-types/PlayerCommand";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import { useGameKeybinds } from "./keybinds/useGameKeybinds";
import { useDevKeybinds } from "./keybinds/useDevKeybinds";
import { useGlobalKeybinds } from "./keybinds/useGlobalKeybinds";

export type DogfightCallbacks = {
    handleClientCommand: (command: PlayerCommand) => void;
};

export function useDogfight({ handleClientCommand }: DogfightCallbacks) {
    const client = useMemo(() => new DogfightClient(), []);
    const engine = useMemo(() => DogfightWeb.new(), []);

    // Scoreboard related information
    const [playerData, setPlayerData] = useState<PlayerProperties[]>([]);
    const [playerGuid, setPlayerGuid] = useState<string | null>(null);
    const [showScoreboard, setShowScoreboard] = useState(false);

    useGameKeybinds({ client, engine });
    useGlobalKeybinds({ toggleScoreboard: setShowScoreboard });
    useDevKeybinds({ client, engine });

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
