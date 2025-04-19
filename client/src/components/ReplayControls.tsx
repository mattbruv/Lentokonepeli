import { ComboboxItem, Select, Stack } from "@mantine/core";
import { PlayerGuid } from "dogfight-types/PlayerGuid";
import { ReplayEvent } from "dogfight-types/ReplayEvent";
import { useMemo } from "react";
import { ReplayTimer } from "./ReplayTimer";

type ReplayControlsProps = {
    // slider props
    currentTick: number;
    maxTicks: number;
    onScrub?: (tick: number) => void;

    // other props
    events: ReplayEvent[];
    players: Record<PlayerGuid, string>;

    spectating: string | null;
    setSpectating: (guid: string | null) => void;
};

export function ReplayControls({
    currentTick,
    maxTicks,
    onScrub,
    events,
    players,
    spectating,
    setSpectating,
}: ReplayControlsProps) {
    const watchPlayers: ComboboxItem[] = useMemo(() => {
        return Object.entries(players).map(([guid, name]): ComboboxItem => {
            return {
                label: name,
                value: guid,
            };
        });
    }, [players]);

    const playerEvents = useMemo(() => {
        return 3;
    }, [events]);

    return (
        <Stack>
            <ReplayTimer currentTick={currentTick} maxTicks={maxTicks} onScrub={onScrub} />
            <div>
                <Select
                    label="Spectating Player"
                    placeholder="Pick a player..."
                    value={spectating}
                    onChange={setSpectating}
                    data={watchPlayers}
                />
            </div>
        </Stack>
    );
}
