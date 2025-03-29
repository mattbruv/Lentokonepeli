import { Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { FormattedMessage, useIntl } from "react-intl";

export const EditorNotice = () => {
    const intl = useIntl();
    return (
        <Alert
            variant="light"
            color="yellow"
            title={intl.formatMessage({
                defaultMessage: "Level Editor Notice",
                description: "title for a notice section for the Level Editor System",
            })}
            icon={<IconInfoCircle />}
        >
            <div>
                <FormattedMessage
                    defaultMessage={
                        "The level editor system is currently highly experimental, lacking many relevant features, and still in active development. You may experience problems until the replay feature is in a stable state."
                    }
                    description={"Informative text about the current state of the replay system"}
                />
            </div>
        </Alert>
    );
};
