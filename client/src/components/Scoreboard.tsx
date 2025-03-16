import { PlayerProperties } from "dogfight-types/PlayerProperties";
import "./Scoreboard.css";
import { Center, Table } from "@mantine/core";
import { formatName } from "../client/helpers";
import { Team } from "dogfight-types/Team";

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
                            <Center>Team</Center>
                        </Table.Th>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>
                            <Center>Score</Center>
                        </Table.Th>
                        <Table.Th>
                            <Center>Frags</Center>
                        </Table.Th>
                        <Table.Th>
                            <Center>Deaths</Center>
                        </Table.Th>
                        <Table.Th>
                            <Center>Accuracy</Center>
                        </Table.Th>
                        <Table.Th>Ping</Table.Th>
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
