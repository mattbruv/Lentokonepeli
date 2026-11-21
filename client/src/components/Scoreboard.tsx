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

function sortPlayers(players: PlayerProperties[]): PlayerProperties[] {
    return [...players].sort((a, b) => {
        const teamOrder = TEAM_SORT_ORDER[a.team ?? "none"] - TEAM_SORT_ORDER[b.team ?? "none"];
        if (teamOrder !== 0) return teamOrder;
        return (b.score ?? 0) - (a.score ?? 0);
    });
}

export function Scoreboard({ playerData, myPlayerGuid, intermission, roomName }: ScoreboardProps) {
    const intl = useIntl();
    const me = playerData.find((x) => x.guid === myPlayerGuid);
    const myTeam = me?.team ?? null;
    const sortedPlayers = sortPlayers(playerData);

    const header = (text: string, className?: string) => <th className={className}>{text}</th>;

    return (
        <div className="scoreboard">
            <div className="room-panel">
                <span className="room-name">{roomName ?? "-"}</span>
            </div>
            <table>
                <thead>
                    <tr className="header">
                        {header(
                            intl.formatMessage({
                                defaultMessage: "T",
                                description: "scoreboard: Team column, one letter",
                            }),
                        )}
                        {header(intl.formatMessage({ defaultMessage: "Name", description: "scoreboard: Name" }))}
                        {header(intl.formatMessage({ defaultMessage: "Score", description: "scoreboard: Score" }))}
                        {header(intl.formatMessage({ defaultMessage: "Frags", description: "scoreboard: Frags" }))}
                        {header(intl.formatMessage({ defaultMessage: "Deaths", description: "scoreboard: Deaths" }))}
                        {header(
                            intl.formatMessage({ defaultMessage: "Accuracy", description: "scoreboard: Accuracy" }),
                        )}
                        {intermission
                            ? header(
                                  intl.formatMessage({
                                      defaultMessage: "Ready",
                                      description: "scoreboard: Ready, shown between rounds",
                                  }),
                                  "ready-header",
                              )
                            : header(intl.formatMessage({ defaultMessage: "Ping", description: "scoreboard: Ping" }))}
                    </tr>
                </thead>
                <tbody>
                    {sortedPlayers.map((player) => (
                        <tr key={player.guid} className={getTeamClass(myTeam, player.team)}>
                            <td className="flag">
                                <img src={getFlag(player.team)} />
                            </td>
                            <td className="name">{formatName(player.name ?? "?", player.clan ?? null)}</td>
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
        </div>
    );
}
