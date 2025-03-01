import { DebugEntity } from "dogfight-types/DebugEntity";
import { PlaneType } from "dogfight-types/PlaneType";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { Team } from "dogfight-types/Team";
import { DogfightWeb } from "dogfight-web";
import { useEffect, useMemo, useRef, useState } from "react";
import { DogfightClient, GameClientCallbacks } from "../client/DogfightClient"
import { PlayerCommand } from "dogfight-types/PlayerCommand";


export function useDogfight(handleClientCommand: (command: PlayerCommand) => void) {
    const client = useMemo(() => (new DogfightClient()), [])
    const engine = useMemo(() => (DogfightWeb.new()), [])

    async function initialize(div: HTMLDivElement): Promise<void> {
        // TODO: clean this up, just expose the onCommand directly in the client
        // and write out the command in the client
        const client_callbacks: GameClientCallbacks = {
            chooseTeam: (team: Team | null): void => {
                handleClientCommand({
                    type: "PlayerChooseTeam",
                    data: { team }
                });
            },
            chooseRunway: (runwayId: number, planeType: PlaneType): void => {
                handleClientCommand({
                    type: "PlayerChooseRunway",
                    data: {
                        plane_type: planeType,
                        runway_id: runwayId,
                    }
                });
            },
            keyChange: (keyboard: PlayerKeyboard): void => {
                handleClientCommand({
                    type: "PlayerKeyboard",
                    data: {
                        ...keyboard,
                    }
                });
            },
        };

        await client.init(client_callbacks, div);

        document.onkeydown = (event) => {
            client.keyboard.onKeyDown(event.key);
        };
        document.onkeyup = (event) => {
            client.keyboard.onKeyUp(event.key);

            // pause/unpause the game
            if (event.key === "q") {
                //paused.current = !paused.current
            }

            if (event.key === "t") {
                //doTick.current = true
            }

            if (event.key === "d") {
                const debugInfo: DebugEntity[] = JSON.parse(engine.debug())
                client.renderDebug(debugInfo);
            }
        };
    }

    useEffect(() => {
        return () => {
            console.log("UseDogfight hook destructor called.")
        }
    }, [])

    return {
        initialize,
        engine,
        client
    }
}
