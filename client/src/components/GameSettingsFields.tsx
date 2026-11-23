import { Select, Tooltip } from "@mantine/core";
import { GameMode } from "dogfight-types/GameMode";
import { useIntl } from "react-intl";
import Levels from "../assets/levels.json";
import { CUSTOM_LEVEL_PREFIX, resolveLevel, useCustomLevels } from "../customLevels";
import { getLevelStats } from "../levelStats";
import { LevelPreview } from "./LevelPreview";
import previewClasses from "./LevelPreview.module.css";

export const GAME_TIME_OPTIONS = [0, 5, 10, 15, 20, 30, 60];

export type GameSettings = {
    levelKey: string;
    gameTime: number;
    gameMode: GameMode;
};

type GameSettingsFieldsProps = {
    value: GameSettings;
    onChange: (value: GameSettings) => void;
    className?: string;
    levelClassNames?: { input?: string; option?: string };
};

export function GameSettingsFields({ value, onChange, className, levelClassNames }: GameSettingsFieldsProps) {
    const intl = useIntl();
    const customLevels = useCustomLevels();
    const levelKey = resolveLevel(value.levelKey, customLevels).key;

    return (
        <>
            <Select
                className={className}
                label={intl.formatMessage({
                    defaultMessage: "Level",
                    description: "Title for selection used to choose the game level",
                })}
                classNames={levelClassNames}
                data={[
                    {
                        group: intl.formatMessage({
                            defaultMessage: "Original levels",
                            description: "Group heading in the level selection for the built-in levels",
                        }),
                        items: Object.keys(Levels),
                    },
                    ...(Object.keys(customLevels).length
                        ? [
                              {
                                  group: intl.formatMessage({
                                      defaultMessage: "My levels",
                                      description:
                                          "Group heading in the level selection for levels saved from the level editor",
                                  }),
                                  items: Object.keys(customLevels).map((name) => ({
                                      value: CUSTOM_LEVEL_PREFIX + name,
                                      label: name,
                                  })),
                              },
                          ]
                        : []),
                ]}
                value={levelKey}
                allowDeselect={false}
                searchable
                maxDropdownHeight={260}
                comboboxProps={{ withinPortal: true }}
                renderOption={({ option }) => {
                    const stats = getLevelStats(resolveLevel(option.value, customLevels).data);
                    if (!stats) return option.label;
                    return (
                        <Tooltip
                            label={<LevelPreview stats={stats} />}
                            position="right"
                            offset={18}
                            openDelay={120}
                            withinPortal
                            color="var(--lk-paper)"
                            classNames={{ tooltip: previewClasses.tooltip }}
                        >
                            <span className={previewClasses.option}>{option.label}</span>
                        </Tooltip>
                    );
                }}
                onChange={(v) => v && onChange({ ...value, levelKey: v })}
                placeholder={intl.formatMessage({
                    defaultMessage: "Select a game map...",
                    description: "Infotext for input used to select which map will be used for the hosted game",
                })}
            />
            <Select
                className={className}
                label={intl.formatMessage({
                    defaultMessage: "Game time",
                    description: "Title for selection used to choose the length of each round",
                })}
                data={GAME_TIME_OPTIONS.map((minutes) => ({
                    value: `${minutes}`,
                    label:
                        minutes === 0
                            ? intl.formatMessage({
                                  defaultMessage: "Unlimited",
                                  description:
                                      "Game time option for rounds that only end when a team's base is destroyed",
                              })
                            : intl.formatMessage(
                                  {
                                      defaultMessage: "{minutes} minutes",
                                      description: "Game time option showing round length",
                                  },
                                  { minutes },
                              ),
                }))}
                value={`${value.gameTime}`}
                allowDeselect={false}
                onChange={(v) => v && onChange({ ...value, gameTime: Number(v) })}
            />
            <Select
                className={className}
                label={intl.formatMessage({
                    defaultMessage: "Game mode",
                    description: "Title for selection used to choose the game mode",
                })}
                data={[
                    {
                        value: "Normal",
                        label: intl.formatMessage({
                            defaultMessage: "Normal",
                            description:
                                "Game mode where players respawn after dying and the round ends when a base is destroyed",
                        }),
                    },
                    {
                        value: "Rounds",
                        label: intl.formatMessage({
                            defaultMessage: "Rounds",
                            description:
                                "Game mode with no respawning, where a team wins a round by eliminating every enemy player or destroying their base",
                        }),
                    },
                ]}
                value={value.gameMode}
                allowDeselect={false}
                onChange={(v) => v && onChange({ ...value, gameMode: v as GameMode })}
            />
        </>
    );
}
