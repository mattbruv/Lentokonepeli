import { ActionIcon, ComboboxItem, MultiSelect, ScrollArea, SegmentedControl, Select } from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import { PlayerGuid } from "dogfight-types/PlayerGuid";
import { ReplayEvent } from "dogfight-types/ReplayEvent";
import { ReplayEventType } from "dogfight-types/ReplayEventType";
import { ReplaySummary } from "dogfight-types/ReplaySummary";
import { useCallback, useMemo, useState } from "react";
import { ticksToHHMMSS } from "../helpers";
import { REPLAY_SPEEDS, ReplayCallbacks, ReplayInfo, ReplaySpeed } from "../hooks/useReplay";
import classes from "./ReplayControls.module.css";
import { ReplayTimer } from "./ReplayTimer";

type ReplayControlsProps = {
    summary: ReplaySummary;
    info: ReplayInfo;
    callbacks: ReplayCallbacks;
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
    ChatMessage: "💬 Chat",
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

    const eventText = useCallback(
        (event: ReplayEvent): string | null => {
            if ("data" in event.event) {
                if (event.event.type !== "ChatMessage") return " " + players[event.event.data];
                else return ": " + event.event.data.message;
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
        <div className={classes.controls}>
            <ReplayTimer info={info} summary={summary} callbacks={callbacks} />
            <SegmentedControl
                fullWidth
                value={`${info.speed}`}
                onChange={(value) => callbacks.setSpeed(Number(value) as ReplaySpeed)}
                data={REPLAY_SPEEDS.map((speed) => ({ value: `${speed}`, label: `${speed}×` }))}
            />
            <hr className={classes.divider} />
            <Select
                label="Spectating Player"
                placeholder="Pick a player..."
                value={info.spectating}
                onChange={callbacks.updateSpectating}
                data={watchPlayers}
            />
            <MultiSelect data={eventOptions} value={viewEvents} onChange={updateViewEvents} />
            {playerEvents.length > 0 && (
                <ScrollArea.Autosize mah={320} type="auto" offsetScrollbars>
                    <ul className={classes.events}>
                        {playerEvents.map((event, i) => (
                            <li key={i} className={classes.event} data-past={event.tick < info.tick || undefined}>
                                <div className={classes.eventBody}>
                                    <div className={classes.eventText}>
                                        {EVENT_NAMES[event.event.type]}
                                        {eventText(event)}
                                    </div>
                                    <div className={classes.eventTime}>{ticksToHHMMSS(event.tick)}</div>
                                </div>
                                <ActionIcon
                                    variant="light"
                                    color="sky"
                                    size="md"
                                    onClick={(_) => callbacks.playToTick(event.tick - 100 * 5)}
                                    aria-label={ticksToHHMMSS(event.tick)}
                                >
                                    <IconEye size={16} stroke={2.4} />
                                </ActionIcon>
                            </li>
                        ))}
                    </ul>
                </ScrollArea.Autosize>
            )}
        </div>
    );
}
