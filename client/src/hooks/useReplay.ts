import { ReplayFile } from "dogfight-types/ReplayFile";
import { ServerInput } from "dogfight-types/ServerInput";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { useEffect, useState } from "react";
import { gameLoop } from "../gameLoop";
import { useDogfight } from "./useDogfight";

export function useReplay() {
    console.log("useReplay called!");

    const dogfight = useDogfight({
        // We don't want to do anything with commands sent to the replay client
        handleClientCommand: () => {},
    });

    const [replayFile, setReplayFile] = useState<ReplayFile | null>(null);
    const [spectating, setSpectating] = useState<string | null>(null);

    function loadReplay(binary: Uint8Array): boolean {
        const replay_string = dogfight.engine.replay_file_binary_to_json(binary);
        if (!replay_string) {
            setReplayFile(null);
            return false;
        }

        const replay_file: ReplayFile = JSON.parse(replay_string);
        setReplayFile(replay_file);

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
        if (!replayFile) return;

        dogfight.engine.load_level(replayFile.level_data);

        const updateFn = (currentTick: number) => {
            const tickData = replayFile.ticks.find((x) => x.tick_number === currentTick);

            let input: ServerInput[] = [];
            if (tickData) {
                input = tickData.commands.map(({ command, player_guid_index }) => {
                    const player_guid = Object.entries(replayFile.player_guids).find(
                        ([_, val]) => val === player_guid_index,
                    )![0];

                    const input: ServerInput = {
                        player_guid,
                        command,
                    };

                    return input;
                });
            }

            // Just set to the host for now
            if (!spectating) {
                const host = input.find((x) => x.command.type === "AddPlayer");
                if (host && host.command.type === "AddPlayer") {
                    const { name, guid } = host.command.data;
                    setSpectating(name);
                    dogfight.setMyPlayerGuid(guid);
                }
            }

            const input_string = JSON.stringify(input);
            dogfight.engine.tick(input_string);

            const changed_state = dogfight.engine.flush_changed_state();
            const events = parseServerOutput(changed_state);
            dogfight.handleGameEvents(events);
        };

        gameLoop.setHostEngineUpdateFn(updateFn).start();
    }, [replayFile]);

    useEffect(() => {
        return () => {
            gameLoop.pause();
        };
    }, []);

    return {
        initialize,
        loadReplay,
        playerData: dogfight.playerData,
        playerGuid: dogfight.playerGuid,
        messages: dogfight.messages,
    };
}
