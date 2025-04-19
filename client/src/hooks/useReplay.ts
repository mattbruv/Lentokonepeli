import { PlayerGuid } from "dogfight-types/PlayerGuid";
import { ReplaySummary } from "dogfight-types/ReplaySummary";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { useEffect, useRef, useState } from "react";
import { gameLoop } from "../gameLoop";
import { ticksToHHMMSS } from "../helpers";
import { useDogfight } from "./useDogfight";

export type ReplayInfo = {
    paused: boolean;
    spectating: string | null;
    tick: number;
    timeString: string;
};

export type ReplayCallbacks = {
    setPaused: (value: boolean) => void;
    playToTick: (tick: number) => void;
    updateSpectating: (guid: PlayerGuid | null) => void;
    loadReplay: (binary: Uint8Array) => boolean;
};

export function useReplay() {
    //console.log("useReplay called!");
    const dogfight = useDogfight({
        // We don't want to do anything with commands sent to the replay client
        handleClientCommand: () => {},
    });

    const [replaySummary, setReplaySummary] = useState<ReplaySummary | null>(null);

    const [replayInfo, setReplayInfo] = useState<ReplayInfo>({
        spectating: null,
        paused: false,
        tick: 0,
        timeString: ticksToHHMMSS(0),
    });

    const animateRef = useRef<number | null>(null);
    const replayTick = useRef<number>(0);

    const animate = () => {
        if (!gameLoop.isRunning()) return;

        //        console.log(replayTick.current, replayTick.current % 10);
        if (replayTick.current % 5 === 0) {
            setReplayInfo((prev) => ({
                ...prev,
                tick: replayTick.current,
                timeString: ticksToHHMMSS(replayTick.current),
            }));
        }
        animateRef.current = requestAnimationFrame(animate);
    };

    function loadReplay(binary: Uint8Array): boolean {
        const replay_string = dogfight.engine.get_replay_summary(binary);

        if (!replay_string) {
            setReplaySummary(null);
            return false;
        }

        const summary: ReplaySummary = JSON.parse(replay_string);
        setReplaySummary(summary);

        dogfight.engine.load_replay(binary);

        return true;
    }

    function initialize(div: HTMLDivElement) {
        dogfight.initialize(div);
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
        }
    }

    useEffect(() => {
        console.log("REPLAY FILE CHANGED");
        if (!replaySummary) return;

        const updateFn = (currentTick: number) => {
            if (currentTick > replaySummary.total_ticks) {
                return;
            }

            replayTick.current = currentTick;

            // Advances the game one tick based on replay input
            dogfight.engine.tick_replay();
            const changed_state = dogfight.engine.flush_changed_state();
            const events = parseServerOutput(changed_state);
            dogfight.handleGameEvents(events);
        };

        gameLoop.setHostEngineUpdateFn(updateFn);
        if (replayInfo.paused) {
            gameLoop.stop();
        } else {
            gameLoop.start(replayInfo.tick);
        }
        animateRef.current = requestAnimationFrame(animate);
    }, [replaySummary, replayInfo.paused]);

    useEffect(() => {
        return () => {
            gameLoop.stop();
        };
    }, []);

    function playToTick(tick: number) {
        replayTick.current = tick;
        setReplayInfo((prev) => ({
            ...prev,
            paused: true,
            tick: replayTick.current,
            timeString: ticksToHHMMSS(replayTick.current),
        }));
        dogfight.clearEntities();
        dogfight.engine.load_replay_until(tick);
        const state = dogfight.engine.get_full_state();
        const events = parseServerOutput(state);
        dogfight.handleGameEvents(events);
    }

    const replayCallbacks: ReplayCallbacks = {
        setPaused,
        playToTick,
        updateSpectating,
        loadReplay,
    };

    function setPaused(value: boolean) {
        setReplayInfo((prev) => ({
            ...prev,
            paused: value,
        }));
    }

    return {
        initialize,
        replaySummary,
        replayInfo,
        replayCallbacks,
        playerData: dogfight.playerData,
        playerGuid: dogfight.playerGuid,
        messages: dogfight.messages,
    };
}
