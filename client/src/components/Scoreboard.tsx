import { Center, Table } from "@mantine/core";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import { Team } from "dogfight-types/Team";
import { useIntl } from "react-intl";
import { formatName } from "../client/helpers";
import "./Scoreboard.css";

export type ScoreboardProps = {
    myPlayerGuid: string | null;
    playerData: PlayerProperties[];
};

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

export function Scoreboard({ playerData, myPlayerGuid }: ScoreboardProps) {
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
                            {intl.formatMessage({
                                defaultMessage: "Ping",
                                description: "scoreboard: Ping",
                            })}
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
                            <Table.Td></Table.Td>
                            <Table.Td></Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </div>
    );
}
