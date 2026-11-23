import { Team } from "dogfight-types/Team";
import { FormattedMessage } from "react-intl";
import { LevelStats } from "../levelStats";
import classes from "./LevelPreview.module.css";

const MAP_WIDTH = 240;
const MAP_HEIGHT = 34;
const REFERENCE_WORLD_WIDTH = 8000;
const GROUND_Y = 24;

const FLAGS: Record<Team, string> = {
    Allies: "images/raf_flag_small.gif",
    Centrals: "images/germanflag_small.gif",
};

const TEAM_ORDER: Team[] = ["Allies", "Centrals"];

function TeamCounts({ counts }: { counts: Record<Team, number> }) {
    return (
        <span className={classes.teams}>
            {TEAM_ORDER.map((team) => (
                <span key={team} className={classes.team}>
                    <img src={FLAGS[team]} alt="" />
                    {counts[team]}
                </span>
            ))}
        </span>
    );
}

function MiniMap({ stats }: { stats: LevelStats }) {
    const scale = Math.min(MAP_WIDTH / REFERENCE_WORLD_WIDTH, MAP_WIDTH / stats.width);
    const offset = (MAP_WIDTH - stats.width * scale) / 2;
    const toX = (x: number) => offset + (x - stats.left) * scale;
    const toWidth = (width: number) => Math.max(1.5, width * scale);

    return (
        <svg className={classes.map} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="presentation">
            {stats.ground.map((span, i) => (
                <rect
                    key={`g${i}`}
                    x={toX(span.x)}
                    y={GROUND_Y}
                    width={toWidth(span.width)}
                    height={MAP_HEIGHT - GROUND_Y}
                    className={span.terrain === "Desert" ? classes.desert : classes.grass}
                />
            ))}
            {stats.water.map((span, i) => (
                <rect
                    key={`w${i}`}
                    x={toX(span.x)}
                    y={GROUND_Y + 2}
                    width={toWidth(span.width)}
                    height={MAP_HEIGHT - GROUND_Y - 2}
                    className={classes.water}
                />
            ))}
            {stats.runwayMarkers.map((marker, i) => (
                <rect
                    key={`r${i}`}
                    x={toX(marker.x)}
                    y={GROUND_Y - 4}
                    width={toWidth(marker.width)}
                    height={4}
                    rx={1}
                    className={marker.team === "Allies" ? classes.allies : classes.centrals}
                />
            ))}
            {stats.bunkerMarkers.map((marker, i) => (
                <rect
                    key={`b${i}`}
                    x={toX(marker.x) - 2}
                    y={GROUND_Y - 13}
                    width={toWidth(marker.width) + 4}
                    height={9}
                    rx={1.5}
                    className={`${marker.team === "Allies" ? classes.allies : classes.centrals} ${classes.bunker}`}
                />
            ))}
        </svg>
    );
}

function SizeName({ width }: { width: number }) {
    if (width < 4000) return <FormattedMessage defaultMessage="Small" description="Level preview: map is small" />;
    if (width < 6000)
        return <FormattedMessage defaultMessage="Medium" description="Level preview: map is medium sized" />;
    if (width < 8000) return <FormattedMessage defaultMessage="Large" description="Level preview: map is large" />;
    return <FormattedMessage defaultMessage="Huge" description="Level preview: map is very large" />;
}

function TerrainName({ terrain }: { terrain: LevelStats["terrain"] }) {
    switch (terrain) {
        case "Desert":
            return <FormattedMessage defaultMessage="Desert" description="Level preview: map terrain is desert sand" />;
        case "Mixed":
            return (
                <FormattedMessage
                    defaultMessage="Mixed"
                    description="Level preview: map has both grass and desert terrain"
                />
            );
        default:
            return <FormattedMessage defaultMessage="Grass" description="Level preview: map terrain is grass" />;
    }
}

export function LevelPreview({ stats }: { stats: LevelStats }) {
    return (
        <div className={classes.preview}>
            <div className={classes.header}>
                <span className={classes.name}>{stats.name}</span>
                <span className={classes.designer}>{stats.designer}</span>
            </div>
            <MiniMap stats={stats} />
            <dl className={classes.stats}>
                <dt>
                    <FormattedMessage defaultMessage="Size" description="Level preview: how wide the map is" />
                </dt>
                <dd>
                    <SizeName width={stats.width} />
                </dd>
                <dt>
                    <FormattedMessage defaultMessage="Runways" description="Level preview: runways per team" />
                </dt>
                <dd>
                    <TeamCounts counts={stats.runways} />
                </dd>
                <dt>
                    <FormattedMessage
                        defaultMessage="Headquarters"
                        description="Level preview: headquarters buildings per team"
                    />
                </dt>
                <dd>
                    <TeamCounts counts={stats.bunkers} />
                </dd>
                <dt>
                    <FormattedMessage defaultMessage="Terrain" description="Level preview: ground type of the map" />
                </dt>
                <dd>
                    <TerrainName terrain={stats.terrain} />
                </dd>
                <dt>
                    <FormattedMessage
                        defaultMessage="Water"
                        description="Level preview: how much of the map width is water"
                    />
                </dt>
                <dd>
                    {stats.waterShare > 0 ? (
                        `${Math.max(1, Math.round(stats.waterShare * 100))}%`
                    ) : (
                        <FormattedMessage defaultMessage="None" description="Level preview: map has no water" />
                    )}
                </dd>
                <dt>
                    <FormattedMessage
                        defaultMessage="Wins on time"
                        description="Level preview: which team wins when the round time runs out"
                    />
                </dt>
                <dd>
                    {stats.timeWinner ? (
                        <img className={classes.flag} src={FLAGS[stats.timeWinner]} alt={stats.timeWinner} />
                    ) : (
                        <FormattedMessage
                            defaultMessage="Higher score"
                            description="Level preview: the team with more points wins when time runs out"
                        />
                    )}
                </dd>
            </dl>
        </div>
    );
}
