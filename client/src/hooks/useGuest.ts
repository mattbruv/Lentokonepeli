import { PlayerCommand } from "dogfight-types/PlayerCommand";
import { ServerOutput } from "dogfight-types/ServerOutput";
import Peer from "peerjs";
import { useEffect, useRef } from "react";
import { useDogfight } from "./useDogfight";
import { PeerJSPath } from "./useLocalHost";

export function useGuest(myName: string, clan: string) {
    const peer = useRef<Peer | null>(null);

    const clientCommandCallback = useRef<((command: PlayerCommand) => void) | null>(null);

    const dogfight = useDogfight({
        handleClientCommand: (command) => {
            if (clientCommandCallback.current) {
                clientCommandCallback.current(command);
            }
        },
    });

    async function initialize(div: HTMLDivElement) {
        await dogfight.initialize(div);
    }

    function joinGame(roomId: string): void {
        if (peer.current) return;

        peer.current = new Peer();
        peer.current.on("open", (x) => {
            console.log("Guest:", x);

            const conn = peer.current!.connect(PeerJSPath(roomId));

            conn.on("open", () => {
                // We're the guest, so just send the command off to the remote host.
                clientCommandCallback.current = (command) => {
                    const binary = dogfight.engine.player_command_to_binary(JSON.stringify(command));
                    conn.send(binary);
                };

                const command: PlayerCommand = { type: "AddPlayer", data: { guid: "", name: myName, clan } };

                const cmd = dogfight.engine.player_command_to_binary(JSON.stringify(command));
                conn.send(cmd);

                conn.on("data", (data) => {
                    if (typeof data === "string") {
                        const output: ServerOutput = JSON.parse(data);
                        dogfight.handleGameEvents([output]);
                        if (output.type === "YourPlayerGuid") {
                            dogfight.setMyPlayerGuid(output.data);
                        }
                    } else {
                        // console.log(data)
                        // The type coming in is an ArrayBuffer, need to make it a Uint8Array for
                        // the WASM bridge -> Rust to receive the right type and for it to work.
                        const buffer = new Uint8Array(data as ArrayBuffer);
                        const events_json = dogfight.engine.game_events_from_binary(buffer);
                        const events = JSON.parse(events_json) as ServerOutput[];
                        // console.log(m.data, events_json, events)
                        dogfight.handleGameEvents(events);
                    }
                });
            });
        });
    }

    useEffect(() => {
        return () => {
            console.log("destroy guest");
            peer.current?.removeAllListeners();
            peer.current?.destroy();
        };
    }, []);

    return {
        joinGame,
        initialize,
        playerData: dogfight.playerData,
        playerGuid: dogfight.playerGuid,
        messages: dogfight.messages,
    };
}
