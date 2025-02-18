import { DebugEntity } from "dogfight-types/DebugEntity";
import { GameInput } from "dogfight-types/GameInput";
import { GameOutput } from "dogfight-types/GameOutput";
import { PlaneType } from "dogfight-types/PlaneType";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import { Team } from "dogfight-types/Team";
import { DogfightWeb } from "dogfight-web";
import { useEffect, useRef, useState } from "react";
import { DogfightClient, GameClientCallbacks } from "../client/DogfightClient"
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr"
import Levels from "../assets/levels.json";

const config: RTCConfiguration = {
    iceServers: [
        {
            urls: ["stun:stun.services.mozilla.com", 'stun:stun.l.google.com:19302']
        }
    ]
};

export function useDogfight(username: string) {
    const playerName = useRef(username);
    const client = useRef<DogfightClient>(new DogfightClient())
    const gameEngine = useRef<DogfightWeb>(DogfightWeb.new())
    const tickInput = useRef<GameInput[]>([])
    const doTick = useRef(false)
    const tickInterval = useRef<number | null>(null)

    const paused = useRef<boolean>(false)


    const initClient = async (div: HTMLDivElement) => {

        const callbacks: GameClientCallbacks = {
            chooseTeam: (team: Team | null): void => {
                tickInput.current.push({
                    type: "PlayerChooseTeam",
                    data: {
                        player_name: playerName.current,
                        team,
                    },
                });
            },
            chooseRunway: (runwayId: number, planeType: PlaneType): void => {
                tickInput.current.push({
                    type: "PlayerChooseRunway",
                    data: {
                        player_name: playerName.current,
                        plane_type: planeType,
                        runway_id: runwayId,
                    },
                });
            },
            keyChange: (keyboard: PlayerKeyboard): void => {
                tickInput.current.push({
                    type: "PlayerKeyboard",
                    data: {
                        name: playerName.current,
                        keys: keyboard,
                    },
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

        gameEngine.current.load_level(Levels.africa);
        gameEngine.current.init();

        client.current.setMyPlayerName(playerName.current);

        tickInput.current.push({
            type: "AddPlayer",
            data: {
                name: playerName.current,
            },
        });

        tickInterval.current = window.setInterval(() => {
            if (paused.current && !doTick.current) return;
            doTick.current = false;

            const input_json = JSON.stringify(tickInput.current);
            tickInput.current = [];
            //const start = performance.now();
            const tick = gameEngine.current.tick(input_json);
            //console.log("took " + (performance.now() - start))
            const events_json = gameEngine.current.game_events_from_binary(tick);
            const events = JSON.parse(events_json) as GameOutput[];

            client.current.handleGameEvents(events);
        }, 1000 / 100);

        // WebRTC Initialization
        localConnection.current = new RTCPeerConnection(config)

        localDataChannel.current = localConnection.current.createDataChannel("dogfight", {
            ordered: true,
            negotiated: true,
            id: 0
        })

        localDataChannel.current.onopen = () => {
            console.log("DATA CHANNEL OPENED")
        }

        localDataChannel.current.onmessage = (m) => {
            console.log("ONMESSAGE: ", m)
        }

        localConnection.current.oniceconnectionstatechange = e => {
            console.log("CONNECTION STATE CHANGE:", localConnection.current?.iceConnectionState)
        }

    }

    useEffect(() => {
        return () => {
            if (tickInterval.current) {
                console.log("UseDogfight hook destructor called.")
                window.clearInterval(tickInterval.current)
            }
        }
    }, [])


    const serverConnection = useRef<HubConnection | null>(null)
    const localConnection = useRef<RTCPeerConnection | null>(null)
    //const remoteConnection = useRef<RTCPeerConnection | null>(null)
    const localDataChannel = useRef<RTCDataChannel | null>(null)
    //const remoteDataChannel = useRef<RTCDataChannel | null>(null)

    async function connectToServer(connType: ConnectionType) {
        console.log("attempting to connect as", ConnectionType[connType])

        serverConnection.current = new HubConnectionBuilder()
            .withUrl("http://localhost:3259/signaling")
            .configureLogging(LogLevel.Information)
            .build()

        serverConnection.current.on("ReceiveMessage", (e) => {
            console.log(e)
        })

        serverConnection.current.start()
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
        connectToServer,
        createOffer,
        createAnswer,
        acceptAnswer,
        sendMessage,
        localDataChannel
    }
}

export enum ConnectionType {
    Host,
    Peer
}

