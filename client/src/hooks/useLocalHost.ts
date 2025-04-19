import { PlayerCommand } from "dogfight-types/PlayerCommand";
import { ServerInput } from "dogfight-types/ServerInput";
import { ServerOutput } from "dogfight-types/ServerOutput";
import Peer, { DataConnection } from "peerjs";
import { useEffect, useRef, useState } from "react";
import { useDogfight } from "./useDogfight";

import { LevelName } from "src/views/Lobby";
import Levels from "../assets/levels.json";
import { gameLoop } from "../gameLoop";
import { randomGuid } from "../helpers";

type ConnectedPlayer = {
    player_guid: string;
    connection: DataConnection;
};

export function PeerJSPath(code: string): string {
    return "lentokonepeli-" + code;
}

const HOST_GUID = randomGuid();

export function useLocalHost(gameMap: LevelName, recordGame: boolean, username: string, clan: string) {
    const dogfight = useDogfight({
        handleClientCommand: (clientCommand) => {
            hostInput.current.push({ player_guid: HOST_GUID, command: clientCommand });
        },
    });

    // All players' input state to be processed next tick
    const hostInput = useRef<ServerInput[]>([]);
    const guestInput = useRef<ServerInput[]>([]);

    // Lobby state
    const [roomCode, setRoomCode] = useState<string | null>(null);

    // A collection of the connected users
    const dataConnections = useRef<Map<string, ConnectedPlayer>>(new Map());

    function initialize(div: HTMLDivElement) {
        dogfight.initialize(div);
    }

    function tickGame(currentTick: number) {
        const allCommands = clearPlayerCommands(currentTick);
        const input_json = JSON.stringify(allCommands);
        dogfight.engine.tick(input_json);

        if (currentTick % 2 == 0) {
            const changed_state = dogfight.engine.flush_changed_state();
            // If data channel is open, send updates.
            const events_json = dogfight.engine.game_events_from_binary(changed_state);
            const events = JSON.parse(events_json) as ServerOutput[];

            // Don't send things off unless there's something to send off.
            if (!events.length) return;

            // Send out events to every connection
            for (const [_, dataConnection] of dataConnections.current) {
                dataConnection.connection.send(changed_state);
            }

            // Update client
            dogfight.handleGameEvents(events);
        }
    }

    const peer = useRef<Peer | null>(null);

    function hostGame(): void {
        const code = randomGuid().substring(0, 4);
        setRoomCode(code);

        peer.current = new Peer(PeerJSPath(code));

        peer.current.on("open", (id) => {
            console.log("My Peer id is", id);

            // for now, only support original maps
            // TODO: extend this for custom maps in the future
            const level = Levels[gameMap];
            dogfight.engine.load_level(level);
            dogfight.engine.init();
            console.log(dogfight.engine.get_build_version());
            console.log(dogfight.engine.get_commit());

            dogfight.setMyPlayerGuid(HOST_GUID, false);

            hostInput.current.push({
                player_guid: HOST_GUID,
                command: { type: "AddPlayer", data: { guid: HOST_GUID, name: username, clan } },
            });

            // Set up function to begin ticking the game
            gameLoop.setHostEngineUpdateFn(tickGame).start();
        });

        peer.current.on("connection", (conn) => {
            console.log("GUEST JOINED", conn.connectionId);

            const PLAYER_GUID = randomGuid();

            function removePlayer() {
                dataConnections.current.delete(conn.connectionId);
                hostInput.current.push({
                    player_guid: PLAYER_GUID,
                    command: {
                        type: "RemovePlayer",
                    },
                });
            }

            // Remove player on disconnect
            conn.on("close", () => {
                removePlayer();
            });

            conn.on("open", () => {
                // Add this player to the collection and send them the full state
                //dataConnections.current.set(conn.connectionId, { name: conn.connectionId, conn })
                dataConnections.current.set(conn.connectionId, {
                    player_guid: PLAYER_GUID,
                    connection: conn,
                });

                const all_state = dogfight.engine.get_full_state();
                conn.send(all_state);

                // Set initial guid
                const out: ServerOutput = {
                    type: "YourPlayerGuid",
                    data: PLAYER_GUID,
                };
                conn.send(JSON.stringify(out));

                conn.on("data", (data) => {
                    // console.log(data)
                    const user = dataConnections.current.get(conn.connectionId);

                    if (user) {
                        const buffer = new Uint8Array(data as ArrayBuffer);
                        //const test = "testjaiasdjfoaijseiofjoieji39393393939393" as unknown as Uint8Array
                        const command_json = dogfight.engine.player_command_from_binary(buffer);
                        const command: PlayerCommand = JSON.parse(command_json);

                        if (command.type == "AddPlayer") {
                            user.player_guid = PLAYER_GUID;
                        }

                        guestInput.current.push({ player_guid: user.player_guid, command });
                    }
                });
            });

            conn.on("close", () => {
                dataConnections.current.delete(conn.connectionId);
            });
        });
    }

    function clearPlayerCommands(_tick: number): ServerInput[] {
        const serverInput: ServerInput[] = [...hostInput.current, ...guestInput.current];

        hostInput.current = [];
        guestInput.current = [];

        return serverInput;
    }

    function getReplayBinary(): Uint8Array {
        return dogfight.engine.get_replay_file();
    }

    useEffect(() => {
        return () => {
            console.log("destroy host");
            gameLoop.stop();
            peer.current?.removeAllListeners();
            peer.current?.destroy();
        };
    }, []);

    function sendChatMessage(message: string, global: boolean) {
        hostInput.current.push({
            player_guid: HOST_GUID,
            command: {
                type: "SendMessage",
                data: [message, global],
            },
        });
    }

    return {
        initialize,
        hostGame,
        roomCode,
        getReplayBinary,
        sendChatMessage,
        playerData: dogfight.playerData,
        playerGuid: dogfight.playerGuid,
        messages: dogfight.messages,
    };
}
