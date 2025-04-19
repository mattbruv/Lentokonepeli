import { ChatMessage } from "dogfight-types/ChatMessage";
import { PlaneType } from "dogfight-types/PlaneType";
import { PlayerCommand } from "dogfight-types/PlayerCommand";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { Team } from "dogfight-types/Team";
import { DogfightWeb } from "dogfight-web";
import { useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { DogfightClient, GameClientCallbacks } from "../client/DogfightClient";
import { ChatMessageTimed } from "../components/Chat";
import { randomGuid } from "../helpers";
import { useDevKeybinds } from "./keybinds/useDevKeybinds";
import { useGameKeybinds } from "./keybinds/useGameKeybinds";

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

    useGameKeybinds({ client, engine });
    useDevKeybinds({ client, engine });

    function handleGameEvents(events: ServerOutput[]): void {
        client.handleGameEvents(events);
    }

    function setMyPlayerGuid(guid: string | null, replay: boolean): void {
        setPlayerGuid(guid);
        client.setMyPlayerGuid(guid, replay);
    }

    function initialize(div: HTMLDivElement) {
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
        playerGuid,
        messages,
        playerData,
        engine,
    };
}
