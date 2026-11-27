import { Button, Text, TextInput } from "@mantine/core";
import { IconCheck, IconUserCircle } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { formatName } from "../client/helpers";
import { isValidClan, isValidName, useSettingsContext } from "../contexts/settingsContext";
import classes from "./NameEditor.module.css";

const NAME_MAX_LENGTH = 20;
const CLAN_MAX_LENGTH = 5;
const SAVED_FEEDBACK_MS = 2200;

export type NameEditorProps = {
    showTip: boolean;
    onSuccess?: () => void;
};
export function NameEditor({ showTip, onSuccess }: NameEditorProps) {
    const intl = useIntl();
    const { settings, setSettings } = useSettingsContext();
    const [name, setName] = useState<string>(settings.username ?? "");
    const [clan, setClan] = useState<string>(settings.clan ?? "");
    const [justSaved, setJustSaved] = useState(false);
    const savedTimer = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => () => clearTimeout(savedTimer.current), []);

    function setUsername(event: React.ChangeEvent<HTMLInputElement>): void {
        setName(event.target.value.trim());
        setJustSaved(false);
    }

    function setClanName(event: React.ChangeEvent<HTMLInputElement>): void {
        setClan(event.target.value);
        setJustSaved(false);
    }

    const nameValid = isValidName(name);
    const trimmedClan = clan.trim();
    const clanValid = isValidClan(trimmedClan);
    const dirty = name !== (settings.username ?? "") || trimmedClan !== (settings.clan ?? "");
    const canSubmit = nameValid && clanValid && dirty;

    function confirmName(): void {
        if (!canSubmit) return;

        setSettings((prev) => ({
            ...prev,
            username: name,
            clan: trimmedClan,
        }));
        setClan(trimmedClan);

        setJustSaved(true);
        clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setJustSaved(false), SAVED_FEEDBACK_MS);

        if (onSuccess) {
            onSuccess();
        }
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
        if (event.key === "Enter") {
            confirmName();
        }
    }

    const nameError =
        name.length > 0 && !nameValid
            ? intl.formatMessage({
                  defaultMessage: "Name should be between 3 and 20 characters",
                  description: "Label explaining username constraints",
              })
            : undefined;

    const clanError = !clanValid
        ? intl.formatMessage({
              defaultMessage: "Clan can't contain [ or ]",
              description: "Error shown under the clan field when it contains square brackets",
          })
        : undefined;

    return (
        <form
            className={classes.editor}
            onSubmit={(event) => {
                event.preventDefault();
                confirmName();
            }}
        >
            {showTip && (
                <div>
                    <Text size={"lg"} fw={700}>
                        What name do you want to go by?
                    </Text>
                    <Text size="sm" className={classes.hint}>
                        {intl.formatMessage({
                            defaultMessage: "You can change this any time in the settings menu",
                            description: "Tooltip for the username setting section",
                        })}
                    </Text>
                </div>
            )}
            <div className={classes.nameplate} data-saved={justSaved || undefined} data-empty={!name || undefined}>
                <IconUserCircle size={26} stroke={2} className={classes.nameplateIcon} />
                <span className={classes.nameplateText}>
                    {name ? (
                        formatName(name, trimmedClan || null)
                    ) : (
                        <FormattedMessage
                            defaultMessage="Your name"
                            description="Placeholder in the name preview on the settings page when no username is entered"
                        />
                    )}
                </span>
                {justSaved && <IconCheck size={22} stroke={3} className={classes.nameplateCheck} />}
            </div>
            <div className={classes.fields}>
                <TextInput
                    className={classes.clan}
                    value={clan}
                    onChange={setClanName}
                    onKeyDown={onKeyDown}
                    maxLength={CLAN_MAX_LENGTH}
                    error={clanError}
                    placeholder="ABC"
                    label={intl.formatMessage({
                        defaultMessage: "Clan",
                        description: "Settings section title used to modify the clan name",
                    })}
                    rightSection={<Counter value={clan.length} max={CLAN_MAX_LENGTH} />}
                    rightSectionWidth={44}
                />
                <TextInput
                    className={classes.name}
                    value={name}
                    onChange={setUsername}
                    onKeyDown={onKeyDown}
                    maxLength={NAME_MAX_LENGTH}
                    error={nameError}
                    label={intl.formatMessage({
                        defaultMessage: "Username",
                        description: "Settings section title used to modify the username",
                    })}
                    rightSection={<Counter value={name.length} max={NAME_MAX_LENGTH} />}
                    rightSectionWidth={52}
                />
            </div>
            <Text size="sm" className={classes.hint}>
                {intl.formatMessage({
                    defaultMessage: "An optional clan to prefix to your name",
                    description: "Tooltip for the clan setting section",
                })}
            </Text>
            <Button
                type="submit"
                color="grass"
                disabled={!canSubmit && !justSaved}
                size={"md"}
                className={classes.submit}
                data-saved={justSaved || undefined}
                rightSection={justSaved ? <IconCheck size={20} stroke={3} /> : undefined}
            >
                {justSaved ? (
                    <FormattedMessage
                        defaultMessage={"Name saved!"}
                        description={"Button text shown briefly after the user saves their name in settings"}
                    />
                ) : (
                    <FormattedMessage
                        defaultMessage={"Set name"}
                        description={"Call to action on setting section button which sets the name user has input"}
                    />
                )}
            </Button>
        </form>
    );
}

function Counter({ value, max }: { value: number; max: number }) {
    return (
        <span className={classes.counter} data-full={value >= max || undefined}>
            {value}/{max}
        </span>
    );
}
