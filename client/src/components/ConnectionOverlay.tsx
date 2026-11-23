import { Button, Loader } from "@mantine/core";
import { IconAlertTriangle, IconCheck, IconDoorExit, IconPlugConnectedX } from "@tabler/icons-react";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { ConnectionFailure, GuestStatus } from "../hooks/useGuest";
import classes from "./ConnectionOverlay.module.css";
import { StatusCard, StatusOverlay } from "./ui/StatusCard";

type ConnectionOverlayProps = {
    status: GuestStatus;
    gameCode: string;
    onRetry: () => void;
    onLeave: () => void;
};

const STEPS = ["server", "host", "syncing"] as const;

function StepLabel({ step }: { step: (typeof STEPS)[number] }) {
    switch (step) {
        case "server":
            return (
                <FormattedMessage
                    defaultMessage={"Connecting to server"}
                    description={"Connection step shown while contacting the matchmaking server"}
                />
            );
        case "host":
            return (
                <FormattedMessage
                    defaultMessage={"Reaching the host"}
                    description={"Connection step shown while establishing a connection to the game host"}
                />
            );
        case "syncing":
            return (
                <FormattedMessage
                    defaultMessage={"Loading the battlefield"}
                    description={"Connection step shown while downloading the game state from the host"}
                />
            );
    }
}

function FailureMessage({ reason, gameCode }: { reason: ConnectionFailure; gameCode: string }) {
    switch (reason) {
        case "not-found":
            return (
                <FormattedMessage
                    defaultMessage={"No game was found with code {code}. Check the code and try again."}
                    description={"Error shown when joining a game code that does not exist"}
                    values={{ code: <strong className={classes.code}>{gameCode}</strong> }}
                />
            );
        case "server":
            return (
                <FormattedMessage
                    defaultMessage={"Couldn't reach the server. Check your internet connection and try again."}
                    description={"Error shown when the matchmaking server cannot be reached"}
                />
            );
        case "timeout":
            return (
                <FormattedMessage
                    defaultMessage={
                        "The host didn't respond in time. They may have left, or a firewall is blocking the connection."
                    }
                    description={"Error shown when connecting to the game host times out"}
                />
            );
        case "unsupported":
            return (
                <FormattedMessage
                    defaultMessage={"Your browser doesn't support the connection this game needs."}
                    description={"Error shown when the browser does not support WebRTC"}
                />
            );
        case "unknown":
            return (
                <FormattedMessage
                    defaultMessage={"Something went wrong while connecting to the host."}
                    description={"Generic error shown when joining a game fails"}
                />
            );
    }
}

export function ConnectionOverlay({ status, gameCode, onRetry, onLeave }: ConnectionOverlayProps) {
    if (status.phase === "ready") return null;

    const leaveButton = (
        <Button variant="default" onClick={onLeave}>
            <FormattedMessage
                defaultMessage={"Back to lobby"}
                description={"Button that leaves a game that failed to connect and returns to the lobby"}
            />
        </Button>
    );

    let content: ReactNode;

    if (status.phase === "failed") {
        content = (
            <StatusCard
                icon={<IconAlertTriangle size={40} stroke={2} />}
                title={
                    <FormattedMessage
                        defaultMessage={"Couldn't join game"}
                        description={"Title shown when joining a game fails"}
                    />
                }
                actions={
                    <>
                        {leaveButton}
                        <Button color="sky" onClick={onRetry}>
                            <FormattedMessage
                                defaultMessage={"Try again"}
                                description={"Button that retries joining a game after a failed connection"}
                            />
                        </Button>
                    </>
                }
            >
                <FailureMessage reason={status.reason} gameCode={gameCode} />
            </StatusCard>
        );
    } else if (status.phase === "kicked") {
        content = (
            <StatusCard
                icon={<IconDoorExit size={40} stroke={2} />}
                title={
                    <FormattedMessage
                        defaultMessage={"Removed from game"}
                        description={"Title shown when the host removes this player from the game"}
                    />
                }
                actions={leaveButton}
            >
                <FormattedMessage
                    defaultMessage={"The host removed you from the game."}
                    description={"Message shown when the host removes this player from the game"}
                />
            </StatusCard>
        );
    } else if (status.phase === "disconnected") {
        content = (
            <StatusCard
                icon={<IconPlugConnectedX size={40} stroke={2} />}
                title={
                    <FormattedMessage
                        defaultMessage={"Disconnected"}
                        description={"Title shown when the connection to the game host is lost"}
                    />
                }
                actions={
                    <>
                        {leaveButton}
                        <Button color="sky" onClick={onRetry}>
                            <FormattedMessage
                                defaultMessage={"Rejoin"}
                                description={"Button that reconnects to a game after the connection was lost"}
                            />
                        </Button>
                    </>
                }
            >
                <FormattedMessage
                    defaultMessage={"The connection to the host was lost. The host may have left the game."}
                    description={"Message shown when the connection to the game host is lost"}
                />
            </StatusCard>
        );
    } else {
        const activeIndex = STEPS.indexOf(status.phase);
        content = (
            <StatusCard
                icon={<Loader color="sky" size={36} />}
                title={
                    <FormattedMessage
                        defaultMessage={"Joining game {code}"}
                        description={"Title shown while connecting to a game"}
                        values={{ code: <span className={classes.code}>{gameCode}</span> }}
                    />
                }
                actions={leaveButton}
            >
                <ol className={classes.steps}>
                    {STEPS.map((step, index) => {
                        const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "pending";
                        return (
                            <li key={step} className={classes.step} data-state={state}>
                                <span className={classes.marker}>
                                    {state === "done" && <IconCheck size={14} stroke={3} />}
                                    {state === "active" && <Loader color="sky" size={12} />}
                                </span>
                                <StepLabel step={step} />
                            </li>
                        );
                    })}
                </ol>
            </StatusCard>
        );
    }

    return <StatusOverlay>{content}</StatusOverlay>;
}
