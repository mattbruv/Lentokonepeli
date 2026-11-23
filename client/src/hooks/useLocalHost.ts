import { AddBotRequest } from "dogfight-types/AddBotRequest";
import { BotDifficulty } from "dogfight-types/BotDifficulty";
import { BotInfo } from "dogfight-types/BotInfo";
import { GameMode } from "dogfight-types/GameMode";
import { PlayerCommand } from "dogfight-types/PlayerCommand";
import { ServerInput } from "dogfight-types/ServerInput";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { Team } from "dogfight-types/Team";
import Peer, { DataConnection } from "peerjs";
import { useEffect, useRef, useState } from "react";
import { useDogfight } from "./useDogfight";

import { ResolvedLevel } from "../customLevels";
import { gameLoop } from "../gameLoop";
import { randomGuid } from "../helpers";

type ConnectedPlayer = {
    player_guid: string;
    connection: DataConnection;
    lastPing: number | null;
    replayTransfer: boolean;
    commandWindowStart: number;
    commandCount: number;
    chatTimes: number[];
};

const GUEST_COMMANDS: ReadonlySet<PlayerCommand["type"]> = new Set([
    "AddPlayer",
    "RemovePlayer",
    "PlayerChooseTeam",
    "PlayerChooseRunway",
    "PlayerKeyboard",
    "SendMessage",
]);

export type PingMessage = {
    type: "Ping" | "Pong";
    data: number;
};

export function isPingMessage(message: unknown): message is PingMessage {
    if (typeof message !== "object" || message === null) return false;
    const type = (message as { type?: unknown }).type;
    return type === "Ping" || type === "Pong";
}

export type ReplayMessage =
    | { type: "ReplayRequest" }
    | { type: "ReplayDenied"; data: number }
    | { type: "ReplayStart"; data: number }
    | { type: "ReplayChunk"; data: ArrayBuffer };

export function isReplayMessage(message: unknown): message is ReplayMessage {
    if (typeof message !== "object" || message === null) return false;
    const type = (message as { type?: unknown }).type;
    return type === "ReplayRequest" || type === "ReplayDenied" || type === "ReplayStart" || type === "ReplayChunk";
}

export type LobbyMessage = { type: "LobbyInfo"; data: { name: string } } | { type: "Kicked" } | { type: "WorldReset" };

export function isLobbyMessage(message: unknown): message is LobbyMessage {
    if (typeof message !== "object" || message === null) return false;
    const type = (message as { type?: unknown }).type;
    return type === "LobbyInfo" || type === "Kicked" || type === "WorldReset";
}

export const LOBBY_NAME_MAX_LENGTH = 32;
export const MAX_BOTS = 32;
const KICK_CLOSE_DELAY_MS = 500;
const MAX_GUESTS = 32;
const MAX_GUEST_STRING_LENGTH = 256;
const MAX_GUEST_BINARY_BYTES = 1024;
const MAX_GUEST_COMMANDS_PER_SECOND = 60;
const MAX_GUEST_CHAT_MESSAGES = 5;
const GUEST_CHAT_WINDOW_MS = 5000;
const MAX_GUEST_SEND_BUFFER = 4 * 1024 * 1024;
const MAX_PONG_AGE_MS = 60000;
const REPLAY_CACHE_MS = 10000;

export function sanitizeLobbyName(name: string): string {
    return name.trim().slice(0, LOBBY_NAME_MAX_LENGTH);
}

export type HostGameSettings = {
    level: ResolvedLevel;
    gameTime: number;
    gameMode: GameMode;
};

const INTERMISSION_SECONDS = 20;

export type InitialBots = {
    count: number;
    difficulty: BotDifficulty;
};

export const REPLAY_COOLDOWN_MS = 60000;
const REPLAY_CHUNK_SIZE = 16000;
const REPLAY_MAX_BUFFERED = 64000;
const REPLAY_SEND_INTERVAL_MS = 50;

const PING_INTERVAL_MS = 2000;
const PING_CHANGE_THRESHOLD_MS = 5;

export function PeerJSPath(code: string): string {
    return "lentokonepeli-" + code;
}

const HOST_GUID = randomGuid();

export function useLocalHost(
    initialSettings: HostGameSettings,
    recordGame: boolean,
    username: string,
    clan: string,
    initialLobbyName: string,
    initialBots: InitialBots,
) {
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
    const [bots, setBots] = useState<BotInfo[]>([]);
    const [lobbyName, setLobbyNameState] = useState(sanitizeLobbyName(initialLobbyName));
    const lobbyNameRef = useRef(lobbyName);
    const [gameSettings, setGameSettings] = useState<HostGameSettings>(initialSettings);

    // A collection of the connected users
    const dataConnections = useRef<Map<string, ConnectedPlayer>>(new Map());
    const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const replayRequests = useRef<Map<string, number>>(new Map());
    const replayCache = useRef<{ bytes: Uint8Array; createdAt: number } | null>(null);
    const kickedPeers = useRef<Set<string>>(new Set());

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

            broadcast(changed_state);

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

            dogfight.engine.load_level(initialSettings.level.data);
            dogfight.engine.set_round_settings(initialSettings.gameTime, INTERMISSION_SECONDS);
            dogfight.engine.set_game_mode(initialSettings.gameMode);
            dogfight.engine.init();
            console.log(dogfight.engine.get_build_version());
            console.log(dogfight.engine.get_commit());

            dogfight.setMyPlayerGuid(HOST_GUID, false);

            hostInput.current.push({
                player_guid: HOST_GUID,
                command: { type: "AddPlayer", data: { guid: HOST_GUID, name: username, clan } },
            });

            addBots(initialBots.count, null, initialBots.difficulty);

            // Set up function to begin ticking the game
            gameLoop.setHostEngineUpdateFn(tickGame).start();

            pingInterval.current = setInterval(() => {
                const ping: PingMessage = { type: "Ping", data: performance.now() };
                broadcast(JSON.stringify(ping));
            }, PING_INTERVAL_MS);
        });

        peer.current.on("connection", (conn) => {
            if (
                kickedPeers.current.has(conn.peer) ||
                conn.serialization !== "binary" ||
                dataConnections.current.size >= MAX_GUESTS
            ) {
                conn.on("open", () => conn.close());
                return;
            }

            const PLAYER_GUID = randomGuid();

            conn.on("close", () => {
                dataConnections.current.delete(conn.connectionId);
                hostInput.current.push({ player_guid: PLAYER_GUID, command: { type: "RemovePlayer" } });
            });

            conn.on("error", (err) => {
                console.warn("Guest connection error:", err);
            });

            conn.on("open", () => {
                const user: ConnectedPlayer = {
                    player_guid: PLAYER_GUID,
                    connection: conn,
                    lastPing: null,
                    replayTransfer: false,
                    commandWindowStart: performance.now(),
                    commandCount: 0,
                    chatTimes: [],
                };
                dataConnections.current.set(conn.connectionId, user);

                const out: ServerOutput = { type: "YourPlayerGuid", data: PLAYER_GUID };
                const lobbyInfo: LobbyMessage = { type: "LobbyInfo", data: { name: lobbyNameRef.current } };
                if (
                    !safeSend(user, dogfight.engine.get_full_state()) ||
                    !safeSend(user, JSON.stringify(out)) ||
                    !safeSend(user, JSON.stringify(lobbyInfo))
                ) {
                    return;
                }

                conn.on("data", (data) => {
                    if (!dataConnections.current.has(conn.connectionId)) return;
                    try {
                        handleGuestData(user, data);
                    } catch (err) {
                        console.warn("Ignoring malformed guest message:", err);
                    }
                });
            });
        });
    }

    function dropConnection(user: ConnectedPlayer) {
        dataConnections.current.delete(user.connection.connectionId);
        hostInput.current.push({ player_guid: user.player_guid, command: { type: "RemovePlayer" } });
        try {
            user.connection.close();
        } catch {
            return;
        }
    }

    function safeSend(user: ConnectedPlayer, data: unknown): boolean {
        try {
            if (user.connection.dataChannel?.bufferedAmount > MAX_GUEST_SEND_BUFFER) {
                dropConnection(user);
                return false;
            }
            user.connection.send(data);
            return true;
        } catch (err) {
            console.warn("Dropping guest after failed send:", err);
            dropConnection(user);
            return false;
        }
    }

    function broadcast(data: unknown) {
        for (const user of [...dataConnections.current.values()]) {
            safeSend(user, data);
        }
    }

    function allowCommand(user: ConnectedPlayer): boolean {
        const now = performance.now();
        if (now - user.commandWindowStart >= 1000) {
            user.commandWindowStart = now;
            user.commandCount = 0;
        }
        user.commandCount++;
        return user.commandCount <= MAX_GUEST_COMMANDS_PER_SECOND;
    }

    function allowChat(user: ConnectedPlayer): boolean {
        const now = performance.now();
        user.chatTimes = user.chatTimes.filter((time) => now - time < GUEST_CHAT_WINDOW_MS);
        if (user.chatTimes.length >= MAX_GUEST_CHAT_MESSAGES) return false;
        user.chatTimes.push(now);
        return true;
    }

    function handleGuestData(user: ConnectedPlayer, data: unknown) {
        if (typeof data === "string") {
            if (data.length > MAX_GUEST_STRING_LENGTH) return;
            const message: unknown = JSON.parse(data);
            if (isReplayMessage(message) && message.type === "ReplayRequest") {
                handleReplayRequest(user.connection, user);
            } else if (isPingMessage(message) && message.type === "Pong") {
                handlePong(user, message.data);
            }
            return;
        }

        let buffer: Uint8Array;
        if (data instanceof ArrayBuffer) {
            buffer = new Uint8Array(data);
        } else if (ArrayBuffer.isView(data)) {
            buffer = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        } else {
            return;
        }
        if (buffer.byteLength === 0 || buffer.byteLength > MAX_GUEST_BINARY_BYTES) return;
        if (!allowCommand(user)) return;

        const command_json = dogfight.engine.player_command_from_binary(buffer);
        if (!command_json) return;
        const command = JSON.parse(command_json) as PlayerCommand;

        if (!GUEST_COMMANDS.has(command.type)) return;
        if (command.type === "SendMessage" && !allowChat(user)) return;

        guestInput.current.push({ player_guid: user.player_guid, command });
    }

    function handlePong(user: ConnectedPlayer, sentAt: unknown) {
        if (typeof sentAt !== "number" || !Number.isFinite(sentAt)) return;
        const now = performance.now();
        if (sentAt > now || now - sentAt > MAX_PONG_AGE_MS) return;

        const rtt = Math.min(Math.round(now - sentAt), 65535);
        if (user.lastPing === null || Math.abs(rtt - user.lastPing) >= PING_CHANGE_THRESHOLD_MS) {
            user.lastPing = rtt;
            hostInput.current.push({ player_guid: user.player_guid, command: { type: "SetPing", data: rtt } });
        }
    }

    function handleReplayRequest(conn: DataConnection, user: ConnectedPlayer) {
        if (user.replayTransfer) return;

        const now = performance.now();
        const last = replayRequests.current.get(conn.peer);
        if (last !== undefined && now - last < REPLAY_COOLDOWN_MS) {
            const denied: ReplayMessage = { type: "ReplayDenied", data: Math.ceil(REPLAY_COOLDOWN_MS - (now - last)) };
            safeSend(user, JSON.stringify(denied));
            return;
        }

        replayRequests.current.set(conn.peer, now);
        user.replayTransfer = true;

        setTimeout(() => {
            if (!conn.open) {
                user.replayTransfer = false;
                return;
            }

            const cached = replayCache.current;
            const bytes =
                cached && performance.now() - cached.createdAt < REPLAY_CACHE_MS
                    ? cached.bytes
                    : dogfight.engine.get_replay_file();
            replayCache.current = { bytes, createdAt: cached?.bytes === bytes ? cached.createdAt : performance.now() };

            const start: ReplayMessage = { type: "ReplayStart", data: bytes.length };
            if (!safeSend(user, JSON.stringify(start))) {
                user.replayTransfer = false;
                return;
            }

            let offset = 0;
            const sendChunks = () => {
                if (!conn.open) {
                    user.replayTransfer = false;
                    return;
                }

                while (offset < bytes.length && conn.dataChannel.bufferedAmount < REPLAY_MAX_BUFFERED) {
                    const end = Math.min(offset + REPLAY_CHUNK_SIZE, bytes.length);
                    const chunk: ReplayMessage = { type: "ReplayChunk", data: bytes.slice(offset, end).buffer };
                    if (!safeSend(user, chunk)) {
                        user.replayTransfer = false;
                        return;
                    }
                    offset = end;
                }

                if (offset < bytes.length) {
                    setTimeout(sendChunks, REPLAY_SEND_INTERVAL_MS);
                } else {
                    user.replayTransfer = false;
                }
            };
            sendChunks();
        }, 0);
    }

    function clearPlayerCommands(_tick: number): ServerInput[] {
        const serverInput: ServerInput[] = [...hostInput.current, ...guestInput.current];

        hostInput.current = [];
        guestInput.current = [];

        return serverInput;
    }

    function refreshBots() {
        setBots(JSON.parse(dogfight.engine.get_bots()) as BotInfo[]);
    }

    function addBots(count: number, team: Team | null, difficulty: BotDifficulty) {
        const existing = JSON.parse(dogfight.engine.get_bots()) as BotInfo[];
        const toAdd = Math.max(0, Math.min(count, MAX_BOTS - existing.length));
        const taken = new Set([...existing.map((b) => b.name), ...dogfight.playerData.map((p) => p.name)]);
        let number = 1;
        for (let i = 0; i < toAdd; i++) {
            while (taken.has(`Bot ${number}`)) number++;
            const name = `Bot ${number}`;
            taken.add(name);
            const request: AddBotRequest = { guid: randomGuid(), name, team, difficulty };
            dogfight.engine.add_bot(JSON.stringify(request));
        }
        refreshBots();
    }

    function removeBots(guids: string[]) {
        for (const guid of guids) {
            dogfight.engine.remove_bot(guid);
        }
        refreshBots();
    }

    function kickPlayer(guid: string) {
        if (guid === HOST_GUID) return;
        for (const [connectionId, connected] of dataConnections.current) {
            if (connected.player_guid !== guid) continue;
            const kicked: LobbyMessage = { type: "Kicked" };
            kickedPeers.current.add(connected.connection.peer);
            safeSend(connected, JSON.stringify(kicked));
            dataConnections.current.delete(connectionId);
            setTimeout(() => {
                try {
                    connected.connection.close();
                } catch {
                    return;
                }
            }, KICK_CLOSE_DELAY_MS);
        }
        hostInput.current.push({ player_guid: guid, command: { type: "RemovePlayer" } });
    }

    function changeGame(settings: HostGameSettings) {
        dogfight.engine.change_game(settings.level.data, settings.gameMode, settings.gameTime, INTERMISSION_SECONDS);
        hostInput.current = [];
        guestInput.current = [];
        replayCache.current = null;
        for (const user of dataConnections.current.values()) {
            user.lastPing = null;
        }
        dogfight.clearEntities();
        const reset: LobbyMessage = { type: "WorldReset" };
        broadcast(JSON.stringify(reset));
        setGameSettings(settings);
        refreshBots();
    }

    function endRound() {
        hostInput.current.push({ player_guid: HOST_GUID, command: { type: "EndRound" } });
    }

    function setLobbyName(name: string) {
        const sanitized = sanitizeLobbyName(name);
        lobbyNameRef.current = sanitized;
        setLobbyNameState(sanitized);
        const message: LobbyMessage = { type: "LobbyInfo", data: { name: sanitized } };
        broadcast(JSON.stringify(message));
    }

    function getReplayBinary(): Uint8Array {
        return dogfight.engine.get_replay_file();
    }

    useEffect(() => {
        return () => {
            console.log("destroy host");
            gameLoop.stop();
            if (pingInterval.current) {
                clearInterval(pingInterval.current);
            }
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
        bots,
        addBots,
        removeBots,
        kickPlayer,
        endRound,
        gameSettings,
        changeGame,
        lobbyName,
        setLobbyName,
        hostGuid: HOST_GUID,
        worldState: dogfight.worldState,
        playerData: dogfight.playerData,
        intermission: dogfight.intermission,
        playerGuid: dogfight.playerGuid,
        messages: dogfight.messages,
    };
}
