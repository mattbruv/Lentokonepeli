import { PlayerGuid } from "dogfight-types/PlayerGuid";
import { ReplaySummary } from "dogfight-types/ReplaySummary";
import { InspectEntity } from "dogfight-types/InspectEntity";
import { ReplayVersion } from "dogfight-types/ReplayVersion";
import { GAME_HEIGHT, VIEW_WIDTH } from "../client/constants";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_TICK_INTERVAL, gameLoop, scheduler } from "../gameLoop";
import { KILL_FEED_DURATION_TICKS } from "../client/killfeed";
import { soundManager } from "../client/soundManager";
import { ticksToHHMMSS } from "../helpers";
import { CameraState } from "../client/DogfightClient";
import { useDogfight } from "./useDogfight";

export type ReplayInspection = {
    x: number;
    y: number;
    flipX: boolean;
    flipY: boolean;
    entities: InspectEntity[];
};

const INSPECT_RADIUS_PX = 6;
const BULLET_LIFETIME_TICKS = 175;
const SEEK_WARMUP_TICKS = Math.max(BULLET_LIFETIME_TICKS, KILL_FEED_DURATION_TICKS);
const WARMUP_EVENT_TYPES = new Set<ServerOutput["type"]>(["EntityChanges", "KillEvent"]);

export const REPLAY_SPEEDS = [0.25, 0.5, 1, 2, 4, 8] as const;
export type ReplaySpeed = (typeof REPLAY_SPEEDS)[number];

export type ReplayInfo = {
    paused: boolean;
    speed: ReplaySpeed;
    spectating: string | null;
    tick: number;
    timeString: string;
    showCollision: boolean;
    camera: CameraState;
};

export type ReplayCallbacks = {
    setPaused: (value: boolean) => void;
    playToTick: (tick: number) => void;
    stepFrames: (frames: number) => void;
    advanceSeconds: (seconds: number) => void;
    updateSpectating: (guid: PlayerGuid | null) => void;
    setSpeed: (speed: ReplaySpeed) => void;
    setShowCollision: (value: boolean) => void;
    setFreeCamera: (free: boolean) => void;
    setZoom: (zoom: number) => void;
    stepZoom: (direction: 1 | -1) => void;
    loadReplay: (binary: Uint8Array) => boolean;
};

export function useReplay() {
    //console.log("useReplay called!");
    const dogfight = useDogfight({
        // We don't want to do anything with commands sent to the replay client
        handleClientCommand: () => {},
    });

    const [replaySummary, setReplaySummary] = useState<ReplaySummary | null>(null);
    const [playbackFailed, setPlaybackFailed] = useState(false);

    const [replayInfo, setReplayInfo] = useState<ReplayInfo>({
        spectating: null,
        paused: false,
        speed: 1,
        tick: 0,
        timeString: ticksToHHMMSS(0),
        showCollision: false,
        camera: { free: false, zoom: 1 },
    });

    const replayTick = useRef<number>(0);
    const showCollisionRef = useRef(false);
    const collisionTick = useRef(-1);
    const [inspection, setInspection] = useState<ReplayInspection | null>(null);
    const hoverPoint = useRef<{ x: number; y: number } | null>(null);
    const inspectedTick = useRef(-1);

    useEffect(() => {
        let frameId = requestAnimationFrame(function updateTimer() {
            if (showCollisionRef.current && collisionTick.current !== replayTick.current) {
                collisionTick.current = replayTick.current;
                try {
                    dogfight.drawCollisionDynamic();
                } catch (error) {
                    console.error("Failed to draw collision:", error);
                    setShowCollision(false);
                }
            }
            if (hoverPoint.current && inspectedTick.current !== replayTick.current) {
                inspectedTick.current = replayTick.current;
                refreshInspection();
            }
            setReplayInfo((prev) =>
                prev.tick === replayTick.current
                    ? prev
                    : { ...prev, tick: replayTick.current, timeString: ticksToHHMMSS(replayTick.current) },
            );
            frameId = requestAnimationFrame(updateTimer);
        });
        return () => cancelAnimationFrame(frameId);
    }, []);

    function failPlayback(error: unknown) {
        console.error("Replay playback failed:", error);
        gameLoop.stop();
        setPlaybackFailed(true);
    }

    function getCurrentVersion(): ReplayVersion {
        return { build_version: dogfight.engine.get_build_version(), build_commit: dogfight.engine.get_commit() };
    }

    function getReplayVersion(binary: Uint8Array): ReplayVersion | null {
        try {
            const version_string = dogfight.engine.get_replay_version(binary);
            return version_string ? (JSON.parse(version_string) as ReplayVersion) : null;
        } catch (error) {
            console.error("Failed to read replay version:", error);
            return null;
        }
    }

    function loadReplay(binary: Uint8Array): boolean {
        let summary: ReplaySummary;
        try {
            const replay_string = dogfight.engine.get_replay_summary(binary);
            if (!replay_string) {
                setReplaySummary(null);
                return false;
            }
            summary = JSON.parse(replay_string);
            dogfight.engine.load_replay(binary);
        } catch (error) {
            console.error("Failed to load replay:", error);
            setReplaySummary(null);
            return false;
        }

        setReplaySummary(summary);
        dogfight.setReplayMode();
        updateSpectating(Object.keys(summary.players)[0] ?? null);

        return true;
    }

    function refreshInspection() {
        const point = hoverPoint.current;
        if (!point) {
            dogfight.clearInspection();
            setInspection(null);
            return;
        }
        try {
            const entities = dogfight.inspectAt(point, INSPECT_RADIUS_PX);
            const scale = dogfight.getCanvasScale();
            setInspection(
                entities.length
                    ? {
                          x: point.x * scale,
                          y: point.y * scale,
                          flipX: point.x > VIEW_WIDTH * 0.55,
                          flipY: point.y > GAME_HEIGHT * 0.55,
                          entities,
                      }
                    : null,
            );
        } catch (error) {
            console.error("Failed to inspect replay entities:", error);
            setInspection(null);
        }
    }

    function initialize(div: HTMLDivElement) {
        dogfight.initialize(div);
        dogfight.enableCameraControls((camera) => {
            setReplayInfo((prev) => ({ ...prev, camera }));
            if (hoverPoint.current) refreshInspection();
        });
        dogfight.onPointerHover((point) => {
            hoverPoint.current = point;
            refreshInspection();
        });
    }

    function parseServerOutput(bytes: Uint8Array): ServerOutput[] {
        const events_json = dogfight.engine.game_events_from_binary(bytes);
        const events: ServerOutput[] = JSON.parse(events_json);
        return events;
    }

    function updateSpectating(guid: PlayerGuid | null) {
        setReplayInfo((prev) => ({
            ...prev,
            spectating: guid,
        }));

        if (guid) {
            dogfight.setMyPlayerGuid(guid, true);
            dogfight.setFreeCamera(false);
        }
    }

    useEffect(() => {
        console.log("REPLAY FILE CHANGED");
        if (!replaySummary || playbackFailed) return;

        const updateFn = (currentTick: number) => {
            if (currentTick > replaySummary.total_ticks) {
                return;
            }

            replayTick.current = currentTick;

            try {
                dogfight.engine.tick_replay();
                const changed_state = dogfight.engine.flush_changed_state();
                const events = parseServerOutput(changed_state);
                dogfight.handleGameEvents(events);
            } catch (error) {
                failPlayback(error);
            }
        };

        gameLoop.setHostEngineUpdateFn(updateFn).start();
        gameLoop.setPaused(replayInfo.paused);
    }, [replaySummary, replayInfo.paused, playbackFailed]);

    useEffect(() => {
        return () => {
            gameLoop.stop();
            gameLoop.setTickInterval(DEFAULT_TICK_INTERVAL);
        };
    }, []);

    function playToTick(tick: number) {
        gameLoop.stop();
        replayTick.current = tick;
        setReplayInfo((prev) => ({
            ...prev,
            paused: true,
            tick: replayTick.current,
            timeString: ticksToHHMMSS(replayTick.current),
        }));
        soundManager.setSuppressed(true);
        try {
            dogfight.clearEntities();
            const start = Math.max(0, tick - SEEK_WARMUP_TICKS);
            dogfight.engine.load_replay_until(start);
            dogfight.handleGameEvents(parseServerOutput(dogfight.engine.get_full_state()));
            for (let warmupTick = start + 1; warmupTick <= tick; warmupTick++) {
                dogfight.engine.tick_replay();
                const events = parseServerOutput(dogfight.engine.flush_changed_state());
                dogfight.handleGameEvents(events.filter((event) => WARMUP_EVENT_TYPES.has(event.type)));
                scheduler.runTasks(warmupTick);
            }
            dogfight.refreshView();
        } catch (error) {
            failPlayback(error);
            return;
        } finally {
            soundManager.setSuppressed(false);
        }
        gameLoop.start(tick);
    }

    function stepFrames(frames: number) {
        const current = replayTick.current;
        if (frames < 0) {
            if (current <= 0) return;
            playToTick(Math.max(0, current + frames));
            return;
        }
        const total = replaySummary?.total_ticks ?? current;
        gameLoop.advanceTicks(Math.min(frames, total - current));
    }

    function advanceSeconds(seconds: number) {
        const ticks = seconds * 100;
        let target = replayInfo.tick + ticks;
        if (target < 0) target = 0;
        if (target > (replaySummary?.total_ticks ?? 0)) target = replaySummary?.total_ticks ?? 0;
        playToTick(target);
    }

    function setShowCollision(value: boolean) {
        showCollisionRef.current = value;
        collisionTick.current = -1;
        setReplayInfo((prev) => ({ ...prev, showCollision: value }));

        if (!value) {
            dogfight.clearCollision();
            return;
        }

        try {
            dogfight.drawCollisionTerrain();
        } catch (error) {
            console.error("Failed to draw collision terrain:", error);
            showCollisionRef.current = false;
            setReplayInfo((prev) => ({ ...prev, showCollision: false }));
        }
    }

    function setSpeed(speed: ReplaySpeed) {
        gameLoop.setTickInterval(DEFAULT_TICK_INTERVAL / speed);
        setReplayInfo((prev) => ({
            ...prev,
            speed,
        }));
    }

    const replayCallbacks: ReplayCallbacks = {
        setSpeed,
        setShowCollision,
        setFreeCamera: dogfight.setFreeCamera,
        setZoom: dogfight.setZoom,
        stepZoom: dogfight.stepZoom,
        setPaused,
        playToTick,
        updateSpectating,
        loadReplay,
        stepFrames,
        advanceSeconds,
    };

    function setPaused(value: boolean) {
        setReplayInfo((prev) => ({
            ...prev,
            paused: value,
        }));
    }

    return {
        initialize,
        getCurrentVersion,
        getReplayVersion,
        replaySummary,
        playbackFailed,
        inspection,
        replayInfo,
        replayCallbacks,
        playerData: dogfight.playerData,
        intermission: dogfight.intermission,
        playerGuid: dogfight.playerGuid,
        messages: dogfight.messages,
    };
}
