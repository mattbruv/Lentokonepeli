import { Button, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconAdjustments } from "@tabler/icons-react";
import { FormattedMessage, useIntl } from "react-intl";
import { Settings } from "../views/Settings";

export function InGameSettings() {
    const intl = useIntl();
    const [opened, { open, close }] = useDisclosure();

    return (
        <>
            <Modal
                opened={opened}
                onClose={close}
                size={1040}
                title={intl.formatMessage({
                    defaultMessage: "Settings",
                    description: "Title of the settings dialog opened during a game",
                })}
            >
                <Settings />
            </Modal>
            <Button
                onClick={open}
                variant="default"
                fullWidth
                rightSection={<IconAdjustments size={18} stroke={2.4} />}
            >
                <FormattedMessage
                    defaultMessage="Settings"
                    description="Button that opens the settings dialog during a game"
                />
            </Button>
        </>
    );
}
