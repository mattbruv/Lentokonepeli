import { Button, ComboboxItem, MultiSelect, ScrollArea, Select, Stack, Text } from "@mantine/core";
import { PlayerGuid } from "dogfight-types/PlayerGuid";
import { ReplayEvent } from "dogfight-types/ReplayEvent";
import { ReplayEventType } from "dogfight-types/ReplayEventType";
import { ReplaySummary } from "dogfight-types/ReplaySummary";
import { useCallback, useMemo, useState } from "react";
import { ReplayCallbacks, ReplayInfo } from "src/hooks/useReplay";
import { ticksToHHMMSS } from "../helpers";
import { ReplayTimer } from "./ReplayTimer";

type ReplayControlsProps = {
    summary: ReplaySummary;
    info: ReplayInfo;
    callbacks: ReplayCallbacks;

    // other props
    events: ReplayEvent[];
    players: Record<PlayerGuid, string>;
};

const EVENT_NAMES: Record<ReplayEventType["type"], string> = {
    Suicide: "💥 Suicide",
    Killed: "🔫 Killed",
    KilledBy: "💀 Killed By",
    AbandonedPlane: "🪂 Abandoned",
    Downed: "💢 Downed",
    DownedBy: "☠️ Downed By",
};

export function ReplayControls({ summary, callbacks, events, players, info }: ReplayControlsProps) {
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
        return events.filter((x) => x.player === info.spectating).filter((x) => viewEvents.includes(x.event.type));
    }, [info.spectating, events, viewEvents]);

    const lookupName = useCallback(
        (event: ReplayEvent): string | null => {
            if ("data" in event.event) {
                return players[event.event.data];
            }
            return null;
        },
        [players],
    );

    const eventOptions: ComboboxItem[] = useMemo(() => {
        return Object.entries(EVENT_NAMES).map(([event_type, label]): ComboboxItem => {
            return {
                label,
                value: event_type,
            };
        });
    }, [info.spectating]);

    return (
        <Stack>
            <ReplayTimer info={info} summary={summary} callbacks={callbacks} />
            <Stack>
                <Select
                    label="Spectating Player"
                    placeholder="Pick a player..."
                    value={info.spectating}
                    onChange={callbacks.updateSpectating}
                    data={watchPlayers}
                />
                <div>
                    <MultiSelect data={eventOptions} value={viewEvents} onChange={updateViewEvents} />
                    <ScrollArea h={400}>
                        {playerEvents.map((event, i) => (
                            <div key={i}>
                                <Text c={event.tick < info.tick ? "dimmed" : ""}>
                                    {EVENT_NAMES[event.event.type]} {lookupName(event)}
                                </Text>
                                <Text size="xs" c={"dimmed"}>
                                    {ticksToHHMMSS(event.tick)}
                                </Text>
                                <Button onClick={(_) => callbacks.playToTick(event.tick - 100 * 5)}>👀</Button>
                            </div>
                        ))}
                    </ScrollArea>
                </div>
            </Stack>
        </Stack>
    );
}
