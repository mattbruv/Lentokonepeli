import {
    ActionIcon,
    Button,
    ComboboxItem,
    MultiSelect,
    ScrollArea,
    SegmentedControl,
    Select,
    Switch,
    Tooltip,
} from "@mantine/core";
import { IconCurrentLocation, IconEye, IconZoomIn, IconZoomOut } from "@tabler/icons-react";
import { PlayerGuid } from "dogfight-types/PlayerGuid";
import { ReplayEvent } from "dogfight-types/ReplayEvent";
import { ReplayEventType } from "dogfight-types/ReplayEventType";
import { ReplaySummary } from "dogfight-types/ReplaySummary";
import { Fragment, useCallback, useMemo, useState } from "react";
import { defineMessages, useIntl } from "react-intl";
import {
    ABANDONED_PLANE_COLLISION_COLOR,
    TEAM_COLLISION_COLORS,
    TEAM_COLLISION_KINDS,
    TERRAIN_COLLISION_ALPHA,
    TERRAIN_COLLISION_COLORS,
    TERRAIN_COLLISION_KINDS,
} from "../client/collisionColors";
import { MAX_ZOOM, MIN_ZOOM } from "../client/constants";
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

const COLLISION_LEGEND = defineMessages({
    Plane: { defaultMessage: "Plane", description: "Collision legend label for planes" },
    Man: { defaultMessage: "Pilot", description: "Collision legend label for pilots who bailed out" },
    Bullet: { defaultMessage: "Bullet", description: "Collision legend label for bullets" },
    Bomb: { defaultMessage: "Bomb", description: "Collision legend label for bombs" },
    Explosion: { defaultMessage: "Explosion", description: "Collision legend label for explosions" },
    Runway: { defaultMessage: "Runway", description: "Collision legend label for runways" },
    Bunker: { defaultMessage: "Headquarters", description: "Collision legend label for team headquarters buildings" },
    Ground: { defaultMessage: "Ground", description: "Collision legend label for ground terrain" },
    Water: { defaultMessage: "Water", description: "Collision legend label for water" },
    Coast: { defaultMessage: "Coast", description: "Collision legend label for coastline terrain" },
    LandingZone: { defaultMessage: "Landing zone", description: "Collision legend label for runway landing areas" },
    AbandonedPlane: {
        defaultMessage: "Abandoned plane",
        description: "Collision legend label for planes whose pilot bailed out",
    },
    Centrals: { defaultMessage: "Centrals", description: "Collision legend column header for the Centrals team" },
    Allies: { defaultMessage: "Allies", description: "Collision legend column header for the Allies team" },
});

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
    const intl = useIntl();
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
            <div className={classes.camera}>
                <Button
                    className={classes.follow}
                    variant={info.camera.free ? "default" : "filled"}
                    color="sky"
                    leftSection={<IconCurrentLocation size={18} stroke={2.2} />}
                    onClick={() => callbacks.setFreeCamera(false)}
                >
                    {info.camera.free
                        ? intl.formatMessage({
                              defaultMessage: "Snap to player",
                              description: "Replay camera button that returns the camera to the spectated player",
                          })
                        : intl.formatMessage({
                              defaultMessage: "Following player",
                              description: "Replay camera button label while the camera follows the spectated player",
                          })}
                </Button>
                <div className={classes.zoom}>
                    <ActionIcon
                        variant="default"
                        size="lg"
                        onClick={() => callbacks.stepZoom(-1)}
                        disabled={info.camera.zoom <= MIN_ZOOM + 0.001}
                        aria-label={intl.formatMessage({
                            defaultMessage: "Zoom out",
                            description: "Replay camera zoom out button",
                        })}
                    >
                        <IconZoomOut size={18} stroke={2.2} />
                    </ActionIcon>
                    <Tooltip
                        label={intl.formatMessage({
                            defaultMessage: "Reset zoom",
                            description: "Tooltip for the replay zoom level button that resets zoom to 100%",
                        })}
                    >
                        <button type="button" className={classes.zoomLevel} onClick={() => callbacks.setZoom(1)}>
                            {Math.round(info.camera.zoom * 100)}%
                        </button>
                    </Tooltip>
                    <ActionIcon
                        variant="default"
                        size="lg"
                        onClick={() => callbacks.stepZoom(1)}
                        disabled={info.camera.zoom >= MAX_ZOOM - 0.001}
                        aria-label={intl.formatMessage({
                            defaultMessage: "Zoom in",
                            description: "Replay camera zoom in button",
                        })}
                    >
                        <IconZoomIn size={18} stroke={2.2} />
                    </ActionIcon>
                </div>
            </div>
            <div className={classes.cameraHint}>
                {intl.formatMessage({
                    defaultMessage: "Drag the game to move the camera freely, scroll to zoom.",
                    description: "Hint explaining replay camera mouse controls",
                })}
            </div>
            <Tooltip
                position="left"
                withArrow
                openDelay={150}
                classNames={{ tooltip: classes.legendTooltip, arrow: classes.legendArrow }}
                label={
                    <div className={classes.legend}>
                        <span />
                        <span className={classes.legendHead}>{intl.formatMessage(COLLISION_LEGEND.Centrals)}</span>
                        <span className={classes.legendHead}>{intl.formatMessage(COLLISION_LEGEND.Allies)}</span>
                        {TEAM_COLLISION_KINDS.map((kind) => (
                            <Fragment key={kind}>
                                <span>{intl.formatMessage(COLLISION_LEGEND[kind])}</span>
                                <span
                                    className={classes.swatch}
                                    style={{ borderColor: TEAM_COLLISION_COLORS[kind].Centrals }}
                                />
                                <span
                                    className={classes.swatch}
                                    style={{ borderColor: TEAM_COLLISION_COLORS[kind].Allies }}
                                />
                            </Fragment>
                        ))}
                        <span>{intl.formatMessage(COLLISION_LEGEND.AbandonedPlane)}</span>
                        <span
                            className={`${classes.swatch} ${classes.swatchWide}`}
                            style={{ borderColor: ABANDONED_PLANE_COLLISION_COLOR }}
                        />
                        {TERRAIN_COLLISION_KINDS.map((kind) => (
                            <Fragment key={kind}>
                                <span>{intl.formatMessage(COLLISION_LEGEND[kind])}</span>
                                <span
                                    className={`${classes.swatch} ${classes.swatchWide}`}
                                    style={{
                                        borderColor: TERRAIN_COLLISION_COLORS[kind],
                                        opacity: TERRAIN_COLLISION_ALPHA,
                                    }}
                                />
                            </Fragment>
                        ))}
                    </div>
                }
            >
                <div className={classes.collisionToggle}>
                    <Switch
                        checked={info.showCollision}
                        onChange={(event) => callbacks.setShowCollision(event.currentTarget.checked)}
                        label={intl.formatMessage({
                            defaultMessage: "Show collision",
                            description: "Toggle that draws collision boxes and masks over the replay",
                        })}
                    />
                </div>
            </Tooltip>
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
