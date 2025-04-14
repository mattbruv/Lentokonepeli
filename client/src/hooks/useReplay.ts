import { ReplayEvent } from "dogfight-types/ReplayEvent";
import { ReplaySummary } from "dogfight-types/ReplaySummary";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { useEffect, useRef, useState } from "react";
import { gameLoop } from "../gameLoop";
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
    const [replayEvents, setReplayEvents] = useState<ReplayEvent[] | null>(null);
    const [spectating, setSpectating] = useState<string | null>(null);
    const [replayTime, setReplayTime] = useState<ReplayTime | null>(null);
    const replayTick = useRef<number>(0);

    function loadReplay(binary: Uint8Array): boolean {
        const replay_string = dogfight.engine.replay_file_binary_to_summary(binary);

        if (!replay_string) {
            setReplaySummary(null);
            return false;
        }

        const replay_file: ReplaySummary = JSON.parse(replay_string);
        setReplaySummary(replay_file);

        dogfight.engine.load_replay(binary);

        let events: ReplayEvent[] = JSON.parse(dogfight.engine.get_replay_file_events(binary));
        setReplayEvents(events);

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

    useEffect(() => {
        console.log("REPLAY FILE CHANGED");
        if (!replaySummary) return;

        const updateFn = (currentTick: number) => {
            if (!gameLoop.isRunning()) {
                return;
            }

            replayTick.current = currentTick;

            // Just set to the host for now
            /*
            if (!spectating) {
                const host = input.find((x) => x.command.type === "AddPlayer");
                if (host && host.command.type === "AddPlayer") {
                    const { name, guid } = host.command.data;
                    setSpectating(name);
                    dogfight.setMyPlayerGuid(guid);
                }
            }
            */

            // Advances the game one tick based on replay input
            dogfight.engine.tick_replay();

            const changed_state = dogfight.engine.flush_changed_state();
            const events = parseServerOutput(changed_state);
            dogfight.handleGameEvents(events);
        };

        gameLoop.setHostEngineUpdateFn(updateFn).start();

        function foo() {
            setReplayTime({
                tick: replayTick.current,
                timeString: ticksToHHMMSS(replayTick.current),
            });
            requestAnimationFrame(foo);
        }

        requestAnimationFrame(foo);
    }, [replaySummary]);

    useEffect(() => {
        return () => {
            gameLoop.stop();
        };
    }, []);

    return {
        initialize,
        loadReplay,
        replayEvents,
        replayTime,
        replaySummary,
        playerData: dogfight.playerData,
        playerGuid: dogfight.playerGuid,
        messages: dogfight.messages,
    };
}
