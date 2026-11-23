import { IconRobot } from "@tabler/icons-react";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import { Team } from "dogfight-types/Team";
import { useIntl } from "react-intl";
import { formatName } from "../client/helpers";
import "./Scoreboard.css";

export type ScoreboardProps = {
    myPlayerGuid: string | null;
    playerData: PlayerProperties[];
    intermission: boolean;
    roomName?: string | null;
};

function formatAccuracy(perMille: number): string {
    if (perMille < 100) return `${Math.floor(perMille / 10)}.${perMille % 10}`;
    return `${Math.floor(perMille / 10)}`;
}

const FLAG_IMAGE_SRC: Record<Team, string> = {
    Centrals: "germanflag_small.gif",
    Allies: "raf_flag_small.gif",
};

function getFlag(team?: Team | null) {
    const prefix = "images/";
    if (!team) return prefix + "randomflag_small.gif";
    return prefix + FLAG_IMAGE_SRC[team];
}

function getTeamClass(myTeam: Team | null, theirs: Team | null | undefined): "noteam" | "friendly" | "enemy" {
    if (!theirs) return "noteam";
    if (theirs === myTeam) return "friendly";
    return "enemy";
}

const TEAM_SORT_ORDER: Record<string, number> = { Allies: 0, Centrals: 1, none: 2 };
const SPLIT_THRESHOLD = 12;
const TEAMS: Team[] = ["Allies", "Centrals"];

function sortPlayers(players: PlayerProperties[]): PlayerProperties[] {
    return [...players].sort((a, b) => {
        const teamOrder = TEAM_SORT_ORDER[a.team ?? "none"] - TEAM_SORT_ORDER[b.team ?? "none"];
        if (teamOrder !== 0) return teamOrder;
        return (b.score ?? 0) - (a.score ?? 0);
    });
}

type TableProps = {
    players: PlayerProperties[];
    myPlayerGuid: string | null;
    myTeam: Team | null;
    intermission: boolean;
    showTeamColumn: boolean;
    caption?: { team: Team | null; count: number };
};

function ScoreTable({ players, myPlayerGuid, myTeam, intermission, showTeamColumn, caption }: TableProps) {
    const intl = useIntl();
    const header = (text: string, className?: string) => <th className={className}>{text}</th>;

    const table = (
        <table>
            <thead>
                <tr className="header">
                    {showTeamColumn &&
                        header(
                            intl.formatMessage({
                                defaultMessage: "T",
                                description: "scoreboard: Team column, one letter",
                            }),
                            "col-team",
                        )}
                    {header(
                        intl.formatMessage({ defaultMessage: "Name", description: "scoreboard: Name" }),
                        "col-name",
                    )}
                    {header(
                        intl.formatMessage({ defaultMessage: "Score", description: "scoreboard: Score" }),
                        "col-num",
                    )}
                    {header(
                        intl.formatMessage({ defaultMessage: "Frags", description: "scoreboard: Frags" }),
                        "col-num",
                    )}
                    {header(
                        intl.formatMessage({ defaultMessage: "Deaths", description: "scoreboard: Deaths" }),
                        "col-num",
                    )}
                    {header(
                        intl.formatMessage({ defaultMessage: "Accuracy", description: "scoreboard: Accuracy" }),
                        "col-wide",
                    )}
                    {intermission
                        ? header(
                              intl.formatMessage({
                                  defaultMessage: "Ready",
                                  description: "scoreboard: Ready, shown between rounds",
                              }),
                              "col-num ready-header",
                          )
                        : header(
                              intl.formatMessage({ defaultMessage: "Ping", description: "scoreboard: Ping" }),
                              "col-num",
                          )}
                </tr>
            </thead>
            <tbody>
                {players.map((player) => (
                    <tr
                        key={player.guid}
                        className={getTeamClass(myTeam, player.team) + (player.guid === myPlayerGuid ? " me" : "")}
                    >
                        {showTeamColumn && (
                            <td className="flag">
                                <img src={getFlag(player.team)} />
                            </td>
                        )}
                        <td className="name">
                            <div className="name-cell">
                                <span className="name-text">{formatName(player.name ?? "?", player.clan ?? null)}</span>
                                {player.bot && (
                                    <IconRobot
                                        className="bot-icon"
                                        size={14}
                                        stroke={2.4}
                                        aria-label={intl.formatMessage({
                                            defaultMessage: "Bot",
                                            description: "scoreboard: accessible label for the icon marking a bot",
                                        })}
                                    />
                                )}
                            </div>
                        </td>
                        <td>{player.score ?? 0}</td>
                        <td>{player.kills ?? 0}</td>
                        <td>{player.deaths ?? 0}</td>
                        <td>{formatAccuracy(player.accuracy ?? 0)}</td>
                        {intermission ? (
                            <td className={player.ready ? "ready" : "not-ready"}>
                                {player.ready
                                    ? intl.formatMessage({
                                          defaultMessage: "yes",
                                          description: "scoreboard: player is ready for the next round",
                                      })
                                    : intl.formatMessage({
                                          defaultMessage: "no",
                                          description: "scoreboard: player is not ready for the next round",
                                      })}
                            </td>
                        ) : (
                            <td>{player.ping ?? 0}</td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    );

    if (!caption) return table;

    return (
        <div className="team-block">
            <div className="team-caption">
                <img src={getFlag(caption.team)} alt="" />
                <span className="team-count">{caption.count}</span>
            </div>
            {table}
        </div>
    );
}

export function Scoreboard({ playerData, myPlayerGuid, intermission, roomName }: ScoreboardProps) {
    const me = playerData.find((x) => x.guid === myPlayerGuid);
    const myTeam = me?.team ?? null;
    const sortedPlayers = sortPlayers(playerData);
    const split = sortedPlayers.length > SPLIT_THRESHOLD;
    const shared = { myPlayerGuid, myTeam, intermission };
    const unassigned = sortedPlayers.filter((p) => !p.team);

    return (
        <div className={split ? "scoreboard split" : "scoreboard"}>
            <div className="room-panel">
                <span className="room-name">{roomName ?? "-"}</span>
            </div>
            <div className="scoreboard-body">
                {split ? (
                    <>
                        <div className="team-columns">
                            {TEAMS.map((team) => {
                                const players = sortedPlayers.filter((p) => p.team === team);
                                return (
                                    <ScoreTable
                                        key={team}
                                        {...shared}
                                        players={players}
                                        showTeamColumn={false}
                                        caption={{ team, count: players.length }}
                                    />
                                );
                            })}
                        </div>
                        {unassigned.length > 0 && (
                            <ScoreTable
                                {...shared}
                                players={unassigned}
                                showTeamColumn={false}
                                caption={{ team: null, count: unassigned.length }}
                            />
                        )}
                    </>
                ) : (
                    <ScoreTable {...shared} players={sortedPlayers} showTeamColumn />
                )}
            </div>
        </div>
    );
}
