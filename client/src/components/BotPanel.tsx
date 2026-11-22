import { ActionIcon, Button, SegmentedControl, Select, Stack, Tooltip } from "@mantine/core";
import { IconRobot, IconUserPlus, IconX } from "@tabler/icons-react";
import { BotDifficulty } from "dogfight-types/BotDifficulty";
import { BotInfo } from "dogfight-types/BotInfo";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import { Team } from "dogfight-types/Team";
import { useState } from "react";
import { defineMessages, FormattedMessage, useIntl } from "react-intl";
import classes from "./BotPanel.module.css";
import { Panel } from "./ui/Panel";

type TeamChoice = Team | "Random";

const DIFFICULTIES: BotDifficulty[] = ["Easy", "Medium", "Hard", "Ace"];

const FLAGS: Record<TeamChoice, string> = {
    Centrals: "images/germanflag_small.gif",
    Allies: "images/raf_flag_small.gif",
    Random: "images/randomflag_small.gif",
};

const MESSAGES = defineMessages({
    Centrals: { defaultMessage: "Centrals", description: "Bot panel: option to add a bot to the Centrals team" },
    Random: { defaultMessage: "Random", description: "Bot panel: option to add a bot to whichever team needs players" },
    Allies: { defaultMessage: "Allies", description: "Bot panel: option to add a bot to the Allies team" },
    Easy: { defaultMessage: "Easy", description: "Bot panel: easiest bot difficulty" },
    Medium: { defaultMessage: "Medium", description: "Bot panel: medium bot difficulty" },
    Hard: { defaultMessage: "Hard", description: "Bot panel: hard bot difficulty" },
    Ace: { defaultMessage: "Ace", description: "Bot panel: hardest bot difficulty" },
});

type BotPanelProps = {
    bots: BotInfo[];
    playerData: PlayerProperties[];
    onAddBot: (team: Team | null, difficulty: BotDifficulty) => void;
    onRemoveBot: (guid: string) => void;
};

export function BotPanel({ bots, playerData, onAddBot, onRemoveBot }: BotPanelProps) {
    const intl = useIntl();
    const [team, setTeam] = useState<TeamChoice>("Random");
    const [difficulty, setDifficulty] = useState<BotDifficulty>("Medium");

    const teamOption = (choice: TeamChoice) => ({
        value: choice,
        label: (
            <span className={classes.teamOption}>
                <img src={FLAGS[choice]} alt="" />
                {intl.formatMessage(MESSAGES[choice])}
            </span>
        ),
    });

    return (
        <Panel
            icon={<IconRobot size={24} stroke={2.4} />}
            title={<FormattedMessage defaultMessage="Bots" description="Title of the host panel for managing bots" />}
        >
            <Stack gap="sm">
                <SegmentedControl
                    fullWidth
                    size="xs"
                    value={team}
                    onChange={(value) => setTeam(value as TeamChoice)}
                    data={[teamOption("Centrals"), teamOption("Random"), teamOption("Allies")]}
                />
                <Select
                    label={intl.formatMessage({
                        defaultMessage: "Difficulty",
                        description: "Bot panel: label for the bot difficulty dropdown",
                    })}
                    value={difficulty}
                    onChange={(value) => value && setDifficulty(value as BotDifficulty)}
                    data={DIFFICULTIES.map((d) => ({ value: d, label: intl.formatMessage(MESSAGES[d]) }))}
                    allowDeselect={false}
                />
                <Button
                    color="copper"
                    fullWidth
                    onClick={() => onAddBot(team === "Random" ? null : team, difficulty)}
                    rightSection={<IconUserPlus size={18} stroke={2.4} />}
                >
                    <FormattedMessage defaultMessage="Add Bot" description="Bot panel: button that adds a bot" />
                </Button>
                {bots.length > 0 && (
                    <ul className={classes.list}>
                        {bots.map((bot) => {
                            const player = playerData.find((p) => p.guid === bot.guid);
                            const shownTeam: TeamChoice = player?.team ?? bot.team ?? "Random";
                            return (
                                <li key={bot.guid} className={classes.bot}>
                                    <img src={FLAGS[shownTeam]} alt="" />
                                    <span className={classes.name}>{bot.name}</span>
                                    <span className={classes.difficulty}>
                                        {intl.formatMessage(MESSAGES[bot.difficulty])}
                                    </span>
                                    <Tooltip
                                        label={intl.formatMessage({
                                            defaultMessage: "Remove bot",
                                            description: "Bot panel: tooltip for the button that removes a bot",
                                        })}
                                    >
                                        <ActionIcon
                                            variant="light"
                                            color="copper"
                                            size="sm"
                                            onClick={() => onRemoveBot(bot.guid)}
                                            aria-label={intl.formatMessage({
                                                defaultMessage: "Remove bot",
                                                description: "Bot panel: tooltip for the button that removes a bot",
                                            })}
                                        >
                                            <IconX size={14} stroke={3} />
                                        </ActionIcon>
                                    </Tooltip>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Stack>
        </Panel>
    );
}
