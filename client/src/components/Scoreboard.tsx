import { Center, Table } from "@mantine/core";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import { Team } from "dogfight-types/Team";
import { useIntl } from "react-intl";
import { formatName } from "../client/helpers";
import "./Scoreboard.css";

export type ScoreboardProps = {
    myPlayerGuid: string | null;
    playerData: PlayerProperties[];
    intermission: boolean;
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

function getTeamClass(myTeam: Team, theirs: Team | null | undefined): "noteam" | "friendly" | "enemy" {
    if (!theirs) return "noteam";
    if (theirs === myTeam) return "friendly";
    return "enemy";
}

export function Scoreboard({ playerData, myPlayerGuid, intermission }: ScoreboardProps) {
    const intl = useIntl();
    const me = playerData.find((x) => x.guid === myPlayerGuid);
    const myTeam = me?.team ?? "Centrals";

    const notUs = playerData.filter((x) => x.team != myTeam).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    const us = playerData.filter((x) => x.team == myTeam).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    const sortedPlayers = [...notUs, ...us];

    return (
        <div className="scoreboard">
            <Table verticalSpacing={2}>
                <Table.Thead>
                    <Table.Tr className="header">
                        <Table.Th>
                            <Center>
                                {intl.formatMessage({
                                    defaultMessage: "Team",
                                    description: "scoreboard: Team",
                                })}
                            </Center>
                        </Table.Th>
                        <Table.Th>
                            {intl.formatMessage({
                                defaultMessage: "Name",
                                description: "scoreboard: Name",
                            })}
                        </Table.Th>
                        <Table.Th>
                            <Center>
                                {intl.formatMessage({
                                    defaultMessage: "Score",
                                    description: "scoreboard: Score",
                                })}
                            </Center>
                        </Table.Th>
                        <Table.Th>
                            <Center>
                                {intl.formatMessage({
                                    defaultMessage: "Frags",
                                    description: "scoreboard: Frags",
                                })}
                            </Center>
                        </Table.Th>
                        <Table.Th>
                            <Center>
                                {intl.formatMessage({
                                    defaultMessage: "Deaths",
                                    description: "scoreboard: Deaths",
                                })}
                            </Center>
                        </Table.Th>
                        <Table.Th>
                            <Center>
                                {intl.formatMessage({
                                    defaultMessage: "Accuracy",
                                    description: "scoreboard: Accuracy",
                                })}
                            </Center>
                        </Table.Th>
                        <Table.Th>
                            <Center>
                                {intermission
                                    ? intl.formatMessage({
                                          defaultMessage: "Ready",
                                          description: "scoreboard: Ready, shown between rounds",
                                      })
                                    : intl.formatMessage({
                                          defaultMessage: "Ping",
                                          description: "scoreboard: Ping",
                                      })}
                            </Center>
                        </Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {sortedPlayers.map((player) => (
                        <Table.Tr key={player.guid} className={getTeamClass(myTeam, player.team)}>
                            <Table.Td>
                                <Center>
                                    <img src={getFlag(player.team)} />
                                </Center>
                            </Table.Td>
                            <Table.Td>{formatName(player.name ?? "?", player.clan ?? null)}</Table.Td>
                            <Table.Td>
                                <Center>{player.score ?? 0}</Center>
                            </Table.Td>
                            <Table.Td>
                                <Center>{player.kills ?? 0}</Center>
                            </Table.Td>
                            <Table.Td>
                                <Center>{player.deaths ?? 0}</Center>
                            </Table.Td>
                            <Table.Td>
                                <Center>{formatAccuracy(player.accuracy ?? 0)}</Center>
                            </Table.Td>
                            {intermission ? (
                                <Table.Td className={player.ready ? "ready" : "not-ready"}>
                                    <Center>
                                        {player.ready
                                            ? intl.formatMessage({
                                                  defaultMessage: "yes",
                                                  description: "scoreboard: player is ready for the next round",
                                              })
                                            : intl.formatMessage({
                                                  defaultMessage: "no",
                                                  description: "scoreboard: player is not ready for the next round",
                                              })}
                                    </Center>
                                </Table.Td>
                            ) : (
                                <Table.Td>
                                    <Center>{player.ping ?? 0}</Center>
                                </Table.Td>
                            )}
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </div>
    );
}
