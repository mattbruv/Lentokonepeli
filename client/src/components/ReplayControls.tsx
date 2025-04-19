import { ComboboxItem, MultiSelect, ScrollArea, Select, Stack, Text } from "@mantine/core";
import { PlayerGuid } from "dogfight-types/PlayerGuid";
import { ReplayEvent } from "dogfight-types/ReplayEvent";
import { ReplayEventType } from "dogfight-types/ReplayEventType";
import { useMemo, useState } from "react";
import { ticksToHHMMSS } from "../helpers";
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

const EVENT_NAMES: Record<ReplayEventType["type"], string> = {
    Suicide: "💥 Suicide",
    Killed: "🔫 Killed",
    KilledBy: "💀 Killed By",
    AbandonedPlane: "🪂 Abandoned",
    Downed: "💢 Downed",
    DownedBy: "☠️ Downed By",
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

    const [viewEvents, setViewEvents] = useState<ReplayEventType["type"][]>([]);

    function updateViewEvents(events: string[]) {
        setViewEvents(events as ReplayEventType["type"][]);
    }

    const playerEvents: ReplayEvent[] = useMemo(() => {
        return events.filter((x) => x.player === spectating).filter((x) => viewEvents.includes(x.event.type));
    }, [spectating, events, viewEvents]);

    const eventOptions: ComboboxItem[] = useMemo(() => {
        return Object.entries(EVENT_NAMES).map(([event_type, label]): ComboboxItem => {
            return {
                label,
                value: event_type,
            };
        });
    }, [spectating]);

    return (
        <Stack>
            <ReplayTimer currentTick={currentTick} maxTicks={maxTicks} onScrub={onScrub} />
            <Stack>
                <Select
                    label="Spectating Player"
                    placeholder="Pick a player..."
                    value={spectating}
                    onChange={setSpectating}
                    data={watchPlayers}
                />
                <div>
                    <MultiSelect data={eventOptions} value={viewEvents} onChange={updateViewEvents} />
                    <ScrollArea h={400}>
                        {playerEvents.map((event, i) => (
                            <div key={i}>
                                <Text c={event.tick < currentTick ? "dimmed" : ""}>{event.event.type}</Text>
                                <Text size="xs" c={"dimmed"}>
                                    {ticksToHHMMSS(event.tick)}
                                </Text>
                            </div>
                        ))}
                    </ScrollArea>
                </div>
            </Stack>
        </Stack>
    );
}
