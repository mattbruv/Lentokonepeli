import { Box, Flex, Group, Kbd, Switch, TextInput } from "@mantine/core";
import { ChatMessage } from "dogfight-types/ChatMessage";
import { Team } from "dogfight-types/Team";
import { useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { useSettingsContext } from "../contexts/settingsContext";
import "./Chat.css";

export enum ChatMode {
    Passive,
    MessagingGlobal,
    MessagingTeam,
}

export interface ChatMessageTimed extends ChatMessage {
    guid: string;
    isNewMessage: boolean;
}

export type ChatProps = {
    myTeam: Team | null;
    messages: ChatMessageTimed[];
    onSendMessage: (message: string, isGlobal: boolean) => void;
};

export function Chat({ messages, onSendMessage, myTeam }: ChatProps) {
    const intl = useIntl();
    const [message, setMessage] = useState("");
    const { globalState, sendChatMessage, setGlobalState } = useSettingsContext();
    const { chatState } = globalState;
    const inputRef = useRef<HTMLInputElement>(null);

    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (chatState === ChatMode.Passive) {
            setMessage("");
        } else {
            // Set the focus to the chat input on chat load
            if (inputRef.current) {
                inputRef.current.focus();
            }
            sendChatMessage.current = () => {
                if (message.trim()) {
                    onSendMessage(message, chatState === ChatMode.MessagingGlobal);
                    setGlobalState((prev) => ({
                        ...prev,
                        chatState: ChatMode.Passive,
                    }));
                }
            };
        }
    }, [chatState, message]);

    function getChatClass(): string {
        if (globalState.chatState != ChatMode.Passive) {
            return "chat active";
        }
        return "chat passive";
    }

    let filteredMessages = messages.filter((x) => !x.private || x.team === myTeam);
    filteredMessages = showHistory ? filteredMessages : filteredMessages.slice(-5);

    const renderMessages =
        globalState.chatState === ChatMode.Passive ? filteredMessages.filter((x) => x.isNewMessage) : filteredMessages;

    return (
        <div className={getChatClass()}>
            <Flex direction={"column"} h={"100%"}>
                {globalState.chatState !== ChatMode.Passive && (
                    <Box className="new-message">
                        <TextInput
                            ref={inputRef}
                            onChange={(event) => setMessage(event.target.value)}
                            value={message}
                            placeholder={intl.formatMessage({
                                defaultMessage: "Send a message...",
                                description: "chat: new message input placeholder",
                            })}
                        />
                        <Group>
                            <div>
                                <span>
                                    <Kbd>Esc</Kbd>{" "}
                                    {intl.formatMessage({
                                        defaultMessage: "to close chat",
                                        description: "message indicating 'Esc' closes the chat",
                                    })}
                                </span>
                            </div>
                            <Switch
                                label={intl.formatMessage({
                                    defaultMessage: "Show All Messages",
                                    description: "'show all messages' switch text",
                                })}
                                checked={showHistory}
                                onClick={(e) => setShowHistory(e.currentTarget.checked)}
                            />
                        </Group>
                    </Box>
                )}
                <Box mt={"auto"} className="all-messages">
                    {renderMessages.map((msg) => {
                        const msgClass = (!msg.private ? "global" : "private") + " message";
                        const output = msg.sender_name + ": " + msg.message;
                        return (
                            <div className={msgClass} key={msg.guid}>
                                {output.trim()}
                            </div>
                        );
                    })}
                </Box>
            </Flex>
        </div>
    );
}
