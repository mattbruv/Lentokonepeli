import { Stack, TextInput, Tooltip, Button, Text } from "@mantine/core";
import { useState } from "react";
import { isValidClan, isValidName, useSettingsContext } from "../contexts/settingsContext";


export function NameEditor({ showTip = false }: { showTip?: boolean }) {
    const { settings, setSettings } = useSettingsContext()
    const [name, setName] = useState<string>(settings.username ?? "")
    const [clan, setClan] = useState<string>(settings.clan ?? "")

    function setUsername(event: React.ChangeEvent<HTMLInputElement>): void {
        setName(event.target.value.trim())
    }

    function setClanName(event: React.ChangeEvent<HTMLInputElement>): void {
        setClan(event.target.value.trim())
    }

    function canSubmitModal() {
        return isValidName(name) && isValidClan(clan)
    }


    function confirmName(): void {
        setSettings({
            ...settings,
            username: name,
            clan: clan
        })

        close()
    }

    return (
        <Stack>
            {showTip && (
                <div>
                    <Text size={"lg"}>What name do you want to go by?</Text>
                </div>
            )}
            <TextInput value={name} onChange={setUsername} label="Username" description={showTip ? "You can change this any time in the settings menu" : ""} />
            <TextInput value={clan} onChange={setClanName} label="Clan" description="An optional clan to prefix to your name" />
            <Tooltip disabled={canSubmitModal()} label={"Name should be between 3 and 20 characters"} position={"bottom"}>
                <Button
                    variant="gradient"
                    gradient={{ from: "green", to: "lime", deg: 90 }}
                    disabled={canSubmitModal() == false}
                    size={"lg"}
                    onClick={confirmName}
                >
                    Set Name
                </Button>
            </Tooltip>

        </Stack>
    )

}