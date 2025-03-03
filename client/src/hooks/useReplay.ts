import { ReplayFile } from "dogfight-types/ReplayFile"
import { useEffect, useRef, useState } from "react"
import { useDogfight } from "./useDogfight"
import { ServerInput } from "dogfight-types/ServerInput"
import { ServerOutput } from "dogfight-types/ServerOutput"

export function useReplay() {
    console.log("useReplay called!")

    const dogfight = useDogfight(() => {
        // We don't want to do anything with commands sent to the replay client
    })

    const [replayFile, setReplayFile] = useState<ReplayFile | null>(null)
    const [spectating, setSpectating] = useState<string | null>(null)
    const tick = useRef(0)

    function loadReplay(binary: Uint8Array): boolean {
        const replay_string = dogfight.engine.replay_file_binary_to_json(binary);
        if (!replay_string) {
            setReplayFile(null)
            return false;
        }

        const replay_file: ReplayFile = JSON.parse(replay_string)
        setReplayFile(replay_file)

        return true;
    }

    async function initialize(div: HTMLDivElement) {
        await dogfight.initialize(div);
    }

    function parseServerOutput(bytes: Uint8Array): ServerOutput[] {
        const events_json = dogfight.engine.game_events_from_binary(bytes)
        const events: ServerOutput[] = JSON.parse(events_json);
        return events
    }

    useEffect(() => {
        console.log("REPLAY FILE CHANGED")
        if (!replayFile) return;

        tick.current = 0;
        dogfight.engine.load_level(replayFile.level_data)

        window.setInterval(() => {
            //console.log(tick.current)
            const tickData = replayFile.ticks.find(x => x.tick_number === tick.current)
            tick.current++;

            let input: ServerInput[] = []
            if (tickData) {
                input = tickData.commands.map(({ command, player_guid_index }) => {

                    const player_guid = Object.entries(replayFile.player_guids).find(([_, val]) => val === player_guid_index)![0]

                    const input: ServerInput = {
                        player_guid,
                        command,
                    }

                    return input
                })
            }

            // Just set to the host for now
            if (!spectating) {
                const host = input.find(x => x.command.type === "AddPlayer")
                if (host && host.command.type === "AddPlayer") {
                    const { name, guid } = host.command.data
                    setSpectating(name)
                    dogfight.client.setMyPlayerGuid(guid)
                }
            }

            const input_string = JSON.stringify(input)
            dogfight.engine.tick(input_string)

            const changed_state = dogfight.engine.flush_changed_state()
            const events = parseServerOutput(changed_state)
            dogfight.client.handleGameEvents(events)

        }, 1000 / 100);
    }, [replayFile])

    return {
        initialize,
        loadReplay,
    }
}