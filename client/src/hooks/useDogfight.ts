import { DebugEntity } from "dogfight-types/DebugEntity";
import { PlaneType } from "dogfight-types/PlaneType";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { Team } from "dogfight-types/Team";
import { DogfightWeb } from "dogfight-web";
import { useEffect, useRef } from "react";
import { DogfightClient, GameClientCallbacks } from "../client/DogfightClient"
import Levels from "../assets/levels.json";
import { ServerInput } from "dogfight-types/ServerInput";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { PlayerCommand } from "dogfight-types/PlayerCommand";

const HOST_NAME = "Host"
const GUEST_NAME = "Guest"

export function useDogfight() {
    const client = useRef<DogfightClient>(new DogfightClient())
    const gameEngine = useRef<DogfightWeb>(DogfightWeb.new())
    const ourCommands = useRef<PlayerCommand[]>([])
    const guestCommands = useRef<PlayerCommand[]>([])
    const doTick = useRef(false)
    const tickInterval = useRef<number | null>(null)
    const paused = useRef<boolean>(false)

    // WebRTC stuff
    const localConnection = useRef<RTCPeerConnection | null>(null)
    const localDataChannel = useRef<RTCDataChannel | null>(null)
    const connectionType = useRef<ConnectionType | null>(null)

    function doCommand(command: PlayerCommand) {
        // If we're the host, just add it to the queue.
        if (connectionType.current === ConnectionType.Host) {
            ourCommands.current.push(command)
        }
        // If we're the guest, just send the command off.
        else {
            localDataChannel.current?.send(JSON.stringify(command))
        }
    }

    // Init WebRTC function should be called before this, because we use the value of ConnectionType here
    const initClient = async (div: HTMLDivElement) => {
        const callbacks: GameClientCallbacks = {
            chooseTeam: (team: Team | null): void => {
                doCommand({
                    type: "PlayerChooseTeam",
                    data: { team }
                });
            },
            chooseRunway: (runwayId: number, planeType: PlaneType): void => {
                doCommand({
                    type: "PlayerChooseRunway",
                    data: {
                        plane_type: planeType,
                        runway_id: runwayId,
                    }
                });
            },
            keyChange: (keyboard: PlayerKeyboard): void => {
                doCommand({
                    type: "PlayerKeyboard",
                    data: {
                        ...keyboard,
                    }
                });
            },
        };

        await client.current.init(callbacks, div);

        document.onkeydown = (event) => {
            client.current.keyboard.onKeyDown(event.key);
        };
        document.onkeyup = (event) => {
            client.current.keyboard.onKeyUp(event.key);

            // pause/unpause the game
            if (event.key === "q") {
                paused.current = !paused.current
            }

            if (event.key === "t") {
                doTick.current = true
            }

            if (event.key === "d") {
                const debugInfo: DebugEntity[] = JSON.parse(gameEngine.current.debug())
                client.current.renderDebug(debugInfo);
            }
        };

        // We are host
        if (connectionType.current === ConnectionType.Host) {
            gameEngine.current.load_level(Levels.classic);
            gameEngine.current.init();
            client.current.setMyPlayerName(HOST_NAME);

            ourCommands.current.push({ type: "AddPlayer" });

            let i = 0;
            // If we're the host, define the function which will 
            // 1. process player inputs,
            // 2. tick the game
            // 3. send off updates to connected peers
            tickInterval.current = window.setInterval(() => {
                if (paused.current && !doTick.current) return;
                doTick.current = false;
                const allCommands = processPlayerCommands()
                const input_json = JSON.stringify(allCommands);
                //const start = performance.now();
                gameEngine.current.tick(input_json);

                if (i++ % 2 == 0) {
                    const changed_state = gameEngine.current.flush_changed_state();
                    // If data channel is open, send updates.
                    const events_json = gameEngine.current.game_events_from_binary(changed_state);
                    const events = JSON.parse(events_json) as ServerOutput[];

                    if (localDataChannel.current?.readyState === "open") {
                        // Don't send things off unless there's something to send off.
                        if (events.length) {
                            // console.log(changed_state)
                            localDataChannel.current?.send(changed_state)
                        }
                    }

                    client.current.handleGameEvents(events);
                }
            }, 1000 / 100);
        }
        // We are a guest
        else {
            // set player name
            client.current.setMyPlayerName(GUEST_NAME);
        }
    }

    function processPlayerCommands(): ServerInput[] {

        // Create server input objects which contain the player's name
        // to validate and correctly attribute commands to a player
        const serverInput: ServerInput[] =
            [
                ...ourCommands.current.map(command => ({
                    player_name: HOST_NAME,
                    command
                })),
                ...guestCommands.current.map(command => ({
                    player_name: GUEST_NAME,
                    command
                }))
            ]

        ourCommands.current = [];
        guestCommands.current = [];

        return serverInput
    }

    useEffect(() => {
        return () => {
            if (tickInterval.current) {
                console.log("UseDogfight hook destructor called.")
                window.clearInterval(tickInterval.current)
            }
        }
    }, [])

    function sendCommandToHost(command: PlayerCommand) {
        if (!localDataChannel.current) return;
        localDataChannel.current.send(JSON.stringify(command))
    }

    // Assumes that game assets are loaded before this is ever called.
    function initWebRTC(type: ConnectionType) {
        connectionType.current = type

        // WebRTC Initialization
        localConnection.current = new RTCPeerConnection()

        localDataChannel.current = localConnection.current.createDataChannel("dogfight", {
            ordered: true,
            negotiated: true,
            id: 0
        })

        localDataChannel.current.onopen = () => {

            // send off the current state of the world if we're the host
            if (connectionType.current === ConnectionType.Host) {
                const all_state = gameEngine.current.get_full_state();
                localDataChannel.current?.send(all_state)
            }
            // Otherwise, we're just a guest, let the host know we need to be added
            else {
                sendCommandToHost({ type: "AddPlayer" })
            }
        }

        localDataChannel.current.onmessage = (m) => {
            // Receive, parse, and add player input to the queue
            if (connectionType.current === ConnectionType.Host) {
                if (typeof m.data !== "string") return;
                // Ensure the guest sent a valid command so things don't break.
                if (gameEngine.current.is_valid_command(m.data)) {
                    const command = JSON.parse(m.data) as PlayerCommand
                    // console.log(command)
                    guestCommands.current.push(command)
                }
            }
            // We are the guest, process the server's updates and send them to our client.
            else {
                // The type coming in is an ArrayBuffer, need to make it a Uint8Array for
                // the WASM bridge -> Rust to receive the right type and for it to work.
                const buffer = new Uint8Array(m.data as ArrayBuffer)
                const events_json = gameEngine.current.game_events_from_binary(buffer)
                const events = JSON.parse(events_json) as ServerOutput[];
                console.log(m.data, events_json, events)
                client.current.handleGameEvents(events)
            }
        }

        localConnection.current.oniceconnectionstatechange = e => {
            console.log("CONNECTION STATE CHANGE:", localConnection.current?.iceConnectionState)
        }

    }

    async function createOffer(onIceCandidate: (value: string) => void) {
        if (!localConnection.current) return

        await localConnection.current.setLocalDescription(await localConnection.current.createOffer())
        localConnection.current.onicecandidate = ({ candidate }) => {
            if (candidate) return;
            if (!localConnection.current || !localConnection.current.localDescription) return;
            onIceCandidate(localConnection.current.localDescription.sdp)
        }
    }

    async function createAnswer(offer: string, onIceCandidate: (value: string) => void) {
        if (!localConnection.current) return;
        await localConnection.current.setRemoteDescription({
            type: "offer",
            sdp: offer
        });
        await localConnection.current.setLocalDescription(await localConnection.current.createAnswer());
        localConnection.current.onicecandidate = ({
            candidate
        }) => {
            if (candidate) return;
            if (!localConnection.current || !localConnection.current.localDescription) return;
            onIceCandidate(localConnection.current.localDescription.sdp)
        };
    }

    async function acceptAnswer(answer: string) {
        if (!localConnection.current) return;

        await localConnection.current.setRemoteDescription({
            type: "answer",
            sdp: answer
        });
    }

    function sendMessage(text: string) {
        localDataChannel.current?.send(text)
    }

    return {
        initClient,
        initWebRTC,
        createOffer,
        createAnswer,
        acceptAnswer,
        sendMessage,
    }
}

export enum ConnectionType {
    Host,
    Guest
}

