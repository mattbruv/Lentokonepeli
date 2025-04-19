import { PlayerGuid } from "dogfight-types/PlayerGuid";
import { ReplaySummary } from "dogfight-types/ReplaySummary";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { useEffect, useRef, useState } from "react";
import { gameLoop, noop } from "../gameLoop";
import { ticksToHHMMSS } from "../helpers";
import { useDogfight } from "./useDogfight";

export type ReplayTime = {
    tick: number;
    timeString: string;
};

export function useReplay() {
    console.log("useReplay called!");

    const dogfight = useDogfight({
        // We don't want to do anything with commands sent to the replay client
        handleClientCommand: () => {},
    });

    const [replaySummary, setReplaySummary] = useState<ReplaySummary | null>(null);
    const [spectating, setSpectating] = useState<PlayerGuid | null>(null);
    const [replayTime, setReplayTime] = useState<ReplayTime | null>(null);
    const animateRef = useRef<number | null>(null);
    const replayTick = useRef<number>(0);

    const animate = () => {
        if (!gameLoop.isRunning()) return;

        setReplayTime({
            tick: replayTick.current,
            timeString: ticksToHHMMSS(replayTick.current),
        });

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
        setSpectating(guid);
        if (guid) {
            dogfight.setMyPlayerGuid(guid);
        }
    }

    useEffect(() => {
        console.log("REPLAY FILE CHANGED");
        if (!replaySummary) return;

        const updateFn = (currentTick: number) => {
            if (currentTick > replaySummary.total_ticks) {
                gameLoop.setHostEngineUpdateFn(noop).stop();
            }

            replayTick.current = currentTick;

            // Advances the game one tick based on replay input
            dogfight.engine.tick_replay();
            const changed_state = dogfight.engine.flush_changed_state();
            const events = parseServerOutput(changed_state);
            dogfight.handleGameEvents(events);
        };

        gameLoop.setHostEngineUpdateFn(updateFn).start();
        animateRef.current = requestAnimationFrame(animate);
    }, [replaySummary]);

    useEffect(() => {
        return () => {
            gameLoop.stop();
        };
    }, []);

    return {
        initialize,
        loadReplay,
        replayTime,
        replaySummary,
        spectating,
        setSpectating: updateSpectating,
        playerData: dogfight.playerData,
        playerGuid: dogfight.playerGuid,
        messages: dogfight.messages,
    };
}
