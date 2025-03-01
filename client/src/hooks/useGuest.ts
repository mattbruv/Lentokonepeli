import { useDogfight } from "./useDogfight";
import { useRef } from "react";
import Peer from "peerjs";
import { PlayerCommand } from "dogfight-types/PlayerCommand";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { PeerJSPath } from "./useLocalHost";


export function useGuest() {
    const peer = useRef<Peer | null>(null)

    const clientCommandCallback = useRef<((command: PlayerCommand) => void) | null>(null)

    const dogfight = useDogfight((command) => {
        if (clientCommandCallback.current) {
            clientCommandCallback.current(command)
        }

    })

    async function initialize(div: HTMLDivElement) {
        await dogfight.initialize(div);
    }

    function joinGame(roomId: string): void {
        if (peer.current) return;

        peer.current = new Peer();
        peer.current.on("open", (x) => {

            console.log("Guest:", x)

            const conn = peer.current!.connect(PeerJSPath(roomId))

            conn.on("open", () => {

                // We're the guest, so just send the command off to the remote host.
                clientCommandCallback.current = (command) => {
                    const binary = dogfight.engine.player_command_to_binary(JSON.stringify(command))
                    conn.send(binary)
                }

                const myName = crypto.randomUUID().substring(0, 8)
                const command: PlayerCommand = { type: "AddPlayer", data: myName }
                dogfight.client.setMyPlayerName(myName)

                const cmd = dogfight.engine.player_command_to_binary(JSON.stringify(command))
                conn.send(cmd)

                conn.on("data", (data) => {
                    // console.log(data)
                    // The type coming in is an ArrayBuffer, need to make it a Uint8Array for
                    // the WASM bridge -> Rust to receive the right type and for it to work.
                    const buffer = new Uint8Array(data as ArrayBuffer)
                    const events_json = dogfight.engine.game_events_from_binary(buffer)
                    const events = JSON.parse(events_json) as ServerOutput[];
                    // console.log(m.data, events_json, events)
                    dogfight.client.handleGameEvents(events)
                })
            })
        })
    }

    return {
        joinGame,
        initialize
    }
}