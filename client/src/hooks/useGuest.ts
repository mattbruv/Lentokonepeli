import { PlayerCommand } from "dogfight-types/PlayerCommand";
import { ServerOutput } from "dogfight-types/ServerOutput";
import Peer, { DataConnection } from "peerjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { gameLoop } from "../gameLoop";
import { useDogfight } from "./useDogfight";
import {
    isLobbyMessage,
    isPingMessage,
    isReplayMessage,
    isSpectatorMessage,
    MAX_MESSAGE_CHARS,
    PeerJSPath,
    PingMessage,
    REPLAY_COOLDOWN_MS,
    ReplayMessage,
    sanitizeChatText,
    SpectatorMessage,
    SpectatorMetadata,
} from "./useLocalHost";

export type ConnectionFailure = "not-found" | "server" | "timeout" | "unsupported" | "unknown";

export type GuestStatus =
    | { phase: "server" }
    | { phase: "host" }
    | { phase: "syncing" }
    | { phase: "ready" }
    | { phase: "failed"; reason: ConnectionFailure }
    | { phase: "disconnected" }
    | { phase: "kicked" };

export type ReplayDownload =
    | { phase: "idle" }
    | { phase: "requesting" }
    | { phase: "downloading"; progress: number }
    | { phase: "cooldown"; until: number };

const SERVER_TIMEOUT_MS = 10000;
const HOST_TIMEOUT_MS = 15000;
const SYNC_TIMEOUT_MS = 15000;
const HEARTBEAT_TIMEOUT_MS = 10000;
const HEARTBEAT_CHECK_MS = 1000;

const SERVER_ERRORS = new Set(["network", "server-error", "socket-error", "socket-closed", "unavailable-id"]);

function failureFromPeerError(type: string): ConnectionFailure {
    if (type === "peer-unavailable") return "not-found";
    if (type === "browser-incompatible") return "unsupported";
    if (SERVER_ERRORS.has(type)) return "server";
    return "unknown";
}

export function useGuest(myName: string, clan: string, spectator: boolean) {
    const peer = useRef<Peer | null>(null);
    const connection = useRef<DataConnection | null>(null);

    const [status, setStatusState] = useState<GuestStatus>({ phase: "server" });
    const statusRef = useRef<GuestStatus>(status);
    const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastMessageAt = useRef(0);
    const [lobbyName, setLobbyName] = useState("");
    const [spectating, setSpectatingState] = useState<string | null>(null);
    const preferredSpectating = useRef<string | null>(null);

    const [replayDownload, setReplayDownloadState] = useState<ReplayDownload>({ phase: "idle" });
    const replayDownloadRef = useRef<ReplayDownload>(replayDownload);
    const replayChunks = useRef<Uint8Array[]>([]);
    const replayReceived = useRef(0);
    const replaySize = useRef(0);
    const replayComplete = useRef<((bytes: Uint8Array) => void) | null>(null);
    const replayCooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clientCommandCallback = useRef<((command: PlayerCommand) => void) | null>(null);
    const sendMessageCallback = useRef<((message: string, isGlobal: boolean) => void) | null>(null);

    const dogfight = useDogfight({
        handleClientCommand: (command) => {
            if (clientCommandCallback.current) {
                clientCommandCallback.current(command);
            }
        },
    });

    function isTerminal(current: GuestStatus) {
        return current.phase === "failed" || current.phase === "disconnected" || current.phase === "kicked";
    }

    function clearTimers() {
        if (phaseTimer.current) clearTimeout(phaseTimer.current);
        if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
        if (replayCooldownTimer.current) clearTimeout(replayCooldownTimer.current);
        phaseTimer.current = null;
        heartbeatTimer.current = null;
        replayCooldownTimer.current = null;
    }

    function teardown() {
        clearTimers();
        clientCommandCallback.current = null;
        sendMessageCallback.current = null;
        connection.current?.removeAllListeners();
        connection.current?.close();
        connection.current = null;
        peer.current?.removeAllListeners();
        peer.current?.destroy();
    }

    function setStatus(next: GuestStatus, timeoutMs?: number) {
        if (isTerminal(statusRef.current)) return;
        statusRef.current = next;
        setStatusState(next);

        if (phaseTimer.current) clearTimeout(phaseTimer.current);
        phaseTimer.current = null;

        if (isTerminal(next)) {
            teardown();
            dogfight.stopAudio();
            gameLoop.stop();
            return;
        }

        if (timeoutMs) {
            phaseTimer.current = setTimeout(() => fail("timeout"), timeoutMs);
        }
    }

    function fail(reason: ConnectionFailure) {
        if (statusRef.current.phase === "ready") {
            setStatus({ phase: "disconnected" });
        } else {
            setStatus({ phase: "failed", reason });
        }
    }

    function becomeReady() {
        setStatus({ phase: "ready" });
        dogfight.startAudio();
        lastMessageAt.current = performance.now();
        heartbeatTimer.current = setInterval(() => {
            if (performance.now() - lastMessageAt.current > HEARTBEAT_TIMEOUT_MS) {
                setStatus({ phase: "disconnected" });
            }
        }, HEARTBEAT_CHECK_MS);
    }

    function initialize(div: HTMLDivElement) {
        dogfight.initialize(div, false);
        gameLoop.start();
    }

    function setSpectating(guid: string | null) {
        setSpectatingState(guid);
        dogfight.setMyPlayerGuid(guid, true);
    }

    const followablePlayers = useMemo(
        () => dogfight.playerData.filter((p): p is typeof p & { guid: string } => !!p.guid),
        [dogfight.playerData],
    );

    function followPlayer(guid: string) {
        preferredSpectating.current = guid;
        setSpectating(guid);
    }

    useEffect(() => {
        if (!spectator || status.phase !== "ready" || followablePlayers.length === 0) return;
        const present = (guid: string | null) => guid !== null && followablePlayers.some((p) => p.guid === guid);
        if (present(preferredSpectating.current)) {
            if (spectating !== preferredSpectating.current) setSpectating(preferredSpectating.current);
            return;
        }
        if (present(spectating)) return;
        const next = followablePlayers.find((p) => !p.bot) ?? followablePlayers[0];
        setSpectating(next.guid);
    }, [spectator, status.phase, spectating, followablePlayers]);

    function sendChatMessage(message: string, global: boolean) {
        if (sendMessageCallback.current) {
            sendMessageCallback.current(message, global);
        }
    }

    function setReplayDownload(next: ReplayDownload) {
        replayDownloadRef.current = next;
        setReplayDownloadState(next);
    }

    function startReplayCooldown(durationMs: number) {
        if (replayCooldownTimer.current) clearTimeout(replayCooldownTimer.current);
        setReplayDownload({ phase: "cooldown", until: Date.now() + durationMs });
        replayCooldownTimer.current = setTimeout(() => {
            replayCooldownTimer.current = null;
            setReplayDownload({ phase: "idle" });
        }, durationMs);
    }

    function requestReplay(onComplete: (bytes: Uint8Array) => void) {
        const conn = connection.current;
        if (!conn || statusRef.current.phase !== "ready") return;
        if (replayDownloadRef.current.phase !== "idle") return;

        replayComplete.current = onComplete;
        setReplayDownload({ phase: "requesting" });
        const request: ReplayMessage = { type: "ReplayRequest" };
        conn.send(JSON.stringify(request));
    }

    function handleReplayMessage(message: ReplayMessage) {
        if (message.type === "ReplayDenied") {
            replayComplete.current = null;
            startReplayCooldown(message.data);
            return;
        }

        if (message.type === "ReplayStart") {
            replayChunks.current = [];
            replayReceived.current = 0;
            replaySize.current = message.data;
            setReplayDownload({ phase: "downloading", progress: 0 });
        } else if (message.type === "ReplayChunk") {
            if (replayDownloadRef.current.phase !== "downloading") return;
            const chunk = new Uint8Array(message.data);
            replayChunks.current.push(chunk);
            replayReceived.current += chunk.length;
            setReplayDownload({ phase: "downloading", progress: replayReceived.current / replaySize.current });
        } else {
            return;
        }

        if (replayReceived.current < replaySize.current) return;

        const bytes = new Uint8Array(replaySize.current);
        let offset = 0;
        for (const chunk of replayChunks.current) {
            bytes.set(chunk, offset);
            offset += chunk.length;
        }
        replayChunks.current = [];

        replayComplete.current?.(bytes);
        replayComplete.current = null;
        startReplayCooldown(REPLAY_COOLDOWN_MS);
    }

    function joinGame(roomId: string): void {
        if (peer.current) return;

        setStatus({ phase: "server" }, SERVER_TIMEOUT_MS);

        peer.current = new Peer();

        peer.current.on("error", (err: { type: string }) => {
            console.error("Guest peer error:", err);
            fail(failureFromPeerError(err.type));
        });

        peer.current.on("open", (x) => {
            console.log("Guest:", x);
            setStatus({ phase: "host" }, HOST_TIMEOUT_MS);

            const metadata: SpectatorMetadata | undefined = spectator ? { spectator: true, name: myName } : undefined;
            const conn = peer.current!.connect(PeerJSPath(roomId), { metadata });
            connection.current = conn;

            let receivedState = false;
            let receivedGuid = false;
            const checkSynced = () => {
                if (receivedState && (receivedGuid || spectator) && statusRef.current.phase === "syncing") {
                    becomeReady();
                }
            };

            conn.on("error", (err) => {
                console.error("Guest connection error:", err);
                fail("unknown");
            });

            conn.on("close", () => {
                fail("unknown");
            });

            conn.on("open", () => {
                setStatus({ phase: "syncing" }, SYNC_TIMEOUT_MS);

                if (spectator) {
                    dogfight.setMyPlayerGuid(null, true);
                    sendMessageCallback.current = (msg) => {
                        const text = sanitizeChatText(msg, MAX_MESSAGE_CHARS);
                        if (!text) return;
                        const say: SpectatorMessage = { type: "SpectatorSay", data: text };
                        conn.send(JSON.stringify(say));
                    };
                }

                conn.on("data", (data) => handleData(data));

                if (spectator) return;

                // We're the guest, so just send the command off to the remote host.
                clientCommandCallback.current = (command) => {
                    const binary = dogfight.engine.player_command_to_binary(JSON.stringify(command));
                    conn.send(binary);
                };

                sendMessageCallback.current = (msg, global) => {
                    const message_command: PlayerCommand = { type: "SendMessage", data: [msg, global] };
                    const binary = dogfight.engine.player_command_to_binary(JSON.stringify(message_command));
                    conn.send(binary);
                };

                const command: PlayerCommand = { type: "AddPlayer", data: { guid: "", name: myName, clan } };

                const cmd = dogfight.engine.player_command_to_binary(JSON.stringify(command));
                conn.send(cmd);
            });

            function handleData(data: unknown) {
                lastMessageAt.current = performance.now();

                if (isReplayMessage(data)) {
                    handleReplayMessage(data);
                    return;
                }

                if (typeof data === "string") {
                    const parsed: unknown = JSON.parse(data);
                    if (isReplayMessage(parsed)) {
                        handleReplayMessage(parsed);
                        return;
                    }
                    if (isLobbyMessage(parsed)) {
                        if (parsed.type === "LobbyInfo") {
                            setLobbyName(parsed.data.name);
                        } else if (parsed.type === "WorldReset") {
                            dogfight.clearEntities();
                        } else {
                            setStatus({ phase: "kicked" });
                        }
                        return;
                    }
                    if (isSpectatorMessage(parsed)) {
                        if (spectator && parsed.type === "SpectatorChat") {
                            dogfight.addMessage(
                                {
                                    sender_name: parsed.data.name,
                                    team: null,
                                    private: false,
                                    message: parsed.data.message,
                                },
                                true,
                            );
                        }
                        return;
                    }
                    if (isPingMessage(parsed)) {
                        if (parsed.type === "Ping") {
                            const pong: PingMessage = { type: "Pong", data: parsed.data };
                            conn.send(JSON.stringify(pong));
                        }
                        return;
                    }
                    const output = parsed as ServerOutput;
                    if (spectator && output.type === "YourPlayerGuid") return;
                    dogfight.handleGameEvents([output]);
                    if (output.type === "YourPlayerGuid") {
                        dogfight.setMyPlayerGuid(output.data, false);
                        receivedGuid = true;
                        checkSynced();
                    }
                } else {
                    // The type coming in is an ArrayBuffer, need to make it a Uint8Array for
                    // the WASM bridge -> Rust to receive the right type and for it to work.
                    const buffer = new Uint8Array(data as ArrayBuffer);
                    const events_json = dogfight.engine.game_events_from_binary(buffer);
                    const events = JSON.parse(events_json) as ServerOutput[];
                    dogfight.handleGameEvents(events);
                    receivedState = true;
                    checkSynced();
                }
            }
        });
    }

    useEffect(() => {
        return () => {
            console.log("destroy guest");
            statusRef.current = { phase: "disconnected" };
            teardown();
            gameLoop.stop();
        };
    }, []);

    return {
        joinGame,
        initialize,
        sendChatMessage,
        requestReplay,
        replayDownload,
        lobbyName,
        status,
        spectating,
        followPlayer,
        followablePlayers,
        playerData: dogfight.playerData,
        intermission: dogfight.intermission,
        playerGuid: dogfight.playerGuid,
        messages: dogfight.messages,
    };
}
