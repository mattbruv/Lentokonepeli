import { Stack, TextInput, Tooltip, Button, Text } from "@mantine/core";
import { useState } from "react";
import { isValidClan, isValidName, useSettingsContext } from "../contexts/settingsContext";
import { FormattedMessage, useIntl } from "react-intl";

export type NameEditorProps = {
    showTip: boolean;
    onSuccess?: () => void;
};
export function NameEditor({ showTip, onSuccess }: NameEditorProps) {
    const intl = useIntl();
    const { settings, setSettings } = useSettingsContext();
    const [name, setName] = useState<string>(settings.username ?? "");
    const [clan, setClan] = useState<string>(settings.clan ?? "");

    function setUsername(event: React.ChangeEvent<HTMLInputElement>): void {
        setName(event.target.value.trim());
    }

    function setClanName(event: React.ChangeEvent<HTMLInputElement>): void {
        setClan(event.target.value.trim());
    }

    function canSubmitModal() {
        return isValidName(name) && isValidClan(clan);
    }

    function confirmName(): void {
        setSettings({
            ...settings,
            username: name,
            clan: clan,
        });

        if (onSuccess) {
            onSuccess();
        }
    }

    return (
        <Stack>
            {showTip && (
                <div>
                    <Text size={"lg"}>What name do you want to go by?</Text>
                </div>
            )}
            <TextInput
                value={name}
                onChange={setUsername}
                label={intl.formatMessage({
                    defaultMessage: "Username",
                    description: "Settings section title used to modify the username",
                })}
                description={
                    showTip
                        ? intl.formatMessage({
                              defaultMessage: "You can change this any time in the settings menu",
                              description: "Tooltip for the username setting section",
                          })
                        : ""
                }
            />
            <TextInput
                value={clan}
                onChange={setClanName}
                label={intl.formatMessage({
                    defaultMessage: "Clan",
                    description: "Settings section title used to modify the clan name",
                })}
                description={intl.formatMessage({
                    defaultMessage: "An optional clan to prefix to your name",
                    description: "Tooltip for the clan setting section",
                })}
            />
            <Tooltip
                disabled={canSubmitModal()}
                label={intl.formatMessage({
                    defaultMessage: "Name should be between 3 and 20 characters",
                    description: "Label explaining username constraints",
                })}
                position={"bottom"}
            >
                <Button
                    variant="gradient"
                    gradient={{ from: "green", to: "lime", deg: 90 }}
                    disabled={canSubmitModal() == false}
                    size={"lg"}
                    onClick={confirmName}
                >
                    <FormattedMessage
                        defaultMessage={"Set name"}
                        description={"Call to action on setting section button which sets the name user has input"}
                    />
                </Button>
            </Tooltip>
        </Stack>
    );
}
