import { DebugEntity } from "dogfight-types/DebugEntity";
import { PlaneType } from "dogfight-types/PlaneType";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { Team } from "dogfight-types/Team";
import { DogfightWeb } from "dogfight-web";
import { useEffect, useRef, useState } from "react";
import { DogfightClient, GameClientCallbacks } from "../client/DogfightClient"
import { ServerInput } from "dogfight-types/ServerInput";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { PlayerCommand } from "dogfight-types/PlayerCommand";
import Levels from "../assets/levels.json";
import Peer, { DataConnection } from "peerjs";

export function useDogfight() {
    const client = useRef<DogfightClient>(new DogfightClient())
    const gameEngine = useRef<DogfightWeb>(DogfightWeb.new())

    const [roomCode, setRoomCode] = useState<string | null>(null)

    const ourInput = useRef<ServerInput[]>([])
    const guestInput = useRef<ServerInput[]>([])
    const doTick = useRef(false)
    const tickInterval = useRef<number | null>(null)
    const paused = useRef<boolean>(false)
    const gameMap = useState<keyof typeof Levels>("classic")

    const tickCounter = useRef(0)
    const initCallback = useRef<(() => void) | null>(null)
    const tickCallback = useRef<(() => void) | null>(null)
    const processCommand = useRef<((command: PlayerCommand) => void) | null>(null)

    // A collection of the connected users
    const dataConnections = useRef<Map<string, { name: string, conn: DataConnection }>>(new Map())

    // Init WebRTC function should be called before this, because we use the value of ConnectionType here
    const initClient = async (div: HTMLDivElement, refreshRate: number) => {
        const callbacks: GameClientCallbacks = {
            chooseTeam: (team: Team | null): void => {
                if (processCommand.current) processCommand.current({
                    type: "PlayerChooseTeam",
                    data: { team }
                });
            },
            chooseRunway: (runwayId: number, planeType: PlaneType): void => {
                if (processCommand.current) processCommand.current({
                    type: "PlayerChooseRunway",
                    data: {
                        plane_type: planeType,
                        runway_id: runwayId,
                    }
                });
            },
            keyChange: (keyboard: PlayerKeyboard): void => {
                if (processCommand.current) processCommand.current({
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

        // We want to do specific things when the host inits
        if (initCallback.current) {
            initCallback.current();
        }

        tickInterval.current = window.setInterval(() => {
            if (tickCallback.current) {
                tickCallback.current()
            }
        }, 1000 / refreshRate);
    }

    function clearPlayerCommands(): ServerInput[] {
        const output: ServerInput[] = [...ourInput.current, ...guestInput.current]

        ourInput.current = [];
        guestInput.current = [];

        return output
    }

    useEffect(() => {
        return () => {
            if (tickInterval.current) {
                console.log("UseDogfight hook destructor called.")
                window.clearInterval(tickInterval.current)
            }
        }
    }, [])

    const peer = useRef<Peer | null>(null)

    function hostLobby(afterConnectionCallback: () => void): void {
        if (peer.current) return;

        // If we're the host, define the function which will 
        // 1. process player inputs,
        // 2. tick the game
        // 3. send off updates to connected peers
        tickCallback.current = () => {
            if (paused.current && !doTick.current) return;
            doTick.current = false;
            const allCommands = clearPlayerCommands()
            const input_json = JSON.stringify(allCommands);
            //const start = performance.now();
            gameEngine.current.tick(input_json);

            if (tickCounter.current++ % 2 == 0) {
                const changed_state = gameEngine.current.flush_changed_state();
                // If data channel is open, send updates.
                const events_json = gameEngine.current.game_events_from_binary(changed_state);
                const events = JSON.parse(events_json) as ServerOutput[];

                // Don't send things off unless there's something to send off.
                if (!events.length) return;

                //console.log(changed_state)
                // Send out events to every connection
                for (const [_, dataConnection] of dataConnections.current) {
                    //localDataChannel.current?.send(changed_state)
                    dataConnection.conn.send(changed_state)
                }
                client.current.handleGameEvents(events);
            }
        }

        const code = crypto.randomUUID().substring(0, 4)
        setRoomCode(code)

        peer.current = new Peer(code);

        peer.current.on("open", (id) => {
            console.log("My Peer id is", id)
            const hostName = "HOST"

            // If we're hosting, send any of our commands directly to the engine
            processCommand.current = (command) => {
                ourInput.current.push({ player_name: hostName, command })
            }

            initCallback.current = () => {
                gameEngine.current.load_level(Levels[gameMap[0]]);
                gameEngine.current.init();
                client.current.setMyPlayerName(hostName);
                ourInput.current.push({
                    player_name: hostName,
                    command: { type: "AddPlayer", data: hostName }
                });
            }

            afterConnectionCallback()
        })

        peer.current.on("connection", (conn) => {
            console.log("GUEST JOINED", conn.connectionId)

            conn.on("open", () => {
                // Add this player to the collection and send them the full state
                dataConnections.current.set(conn.connectionId, { name: conn.connectionId, conn })
                const all_state = gameEngine.current.get_full_state();
                conn.send(all_state)

                conn.on("data", (data) => {
                    //console.log(data)
                    const user = dataConnections.current.get(conn.connectionId)

                    if (user) {
                        if (typeof data !== "string") return;
                        // Ensure the guest sent a valid command so things don't break.
                        if (gameEngine.current.is_valid_command(data)) {
                            const command = JSON.parse(data) as PlayerCommand
                            if (command.type == "AddPlayer") {
                                user.name = command.data
                            }
                            guestInput.current.push({ player_name: user.name, command })
                        }
                    }
                })
            })

            conn.on("close", () => {
                dataConnections.current.delete(conn.connectionId)
            })
        })
    }

    function joinGame(roomId: string, onConnect: () => void): void {
        if (peer.current) return;

        initCallback.current = () => {
            // set player name
            // client.current.setMyPlayerName(GUEST_NAME);
        }

        peer.current = new Peer();
        peer.current.on("open", (x) => {

            console.log("Guest:", x)

            const conn = peer.current!.connect(roomId)

            conn.on("open", () => {

                // If we're the guest, just send the command off.
                processCommand.current = (command) => {
                    conn.send(JSON.stringify(command))
                }

                const myName = crypto.randomUUID().substring(0, 8)
                const command: PlayerCommand = { type: "AddPlayer", data: myName }
                client.current.setMyPlayerName(myName)

                conn.send(JSON.stringify(command))

                conn.on("data", (data) => {
                    // console.log(data)
                    // The type coming in is an ArrayBuffer, need to make it a Uint8Array for
                    // the WASM bridge -> Rust to receive the right type and for it to work.
                    const buffer = new Uint8Array(data as ArrayBuffer)
                    const events_json = gameEngine.current.game_events_from_binary(buffer)
                    const events = JSON.parse(events_json) as ServerOutput[];
                    // console.log(m.data, events_json, events)
                    client.current.handleGameEvents(events)
                })

                onConnect()
            })
        })
    }

    return {
        client,
        gameMap,
        initClient,
        hostLobby,
        joinGame,
        roomCode,
        peer
    }
}
