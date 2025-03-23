import { Box, Flex, Kbd, TextInput } from "@mantine/core";
import { ChatMessage } from "dogfight-types/ChatMessage";
import { useEffect, useState } from "react";
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
    messages: ChatMessageTimed[];
    onSendMessage: (message: string, isGlobal: boolean) => void;
};

export function Chat({ messages, onSendMessage }: ChatProps) {
    const [message, setMessage] = useState("");
    const { globalState, sendChatMessage, setGlobalState } = useSettingsContext();
    const { chatState } = globalState;

    useEffect(() => {
        if (chatState === ChatMode.Passive) {
            setMessage("");
        } else {
            sendChatMessage.current = () => {
                if (message) {
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

    const renderMessages =
        globalState.chatState === ChatMode.Passive ? messages.filter((x) => x.isNewMessage) : messages;

    return (
        <div className={getChatClass()}>
            <Flex direction={"column"} h={"100%"}>
                {globalState.chatState !== ChatMode.Passive && (
                    <Box className="new-message">
                        <TextInput
                            onChange={(event) => setMessage(event.target.value)}
                            value={message}
                            placeholder={"Send a message..."}
                        />
                        <div>
                            <span>
                                <Kbd>Esc</Kbd> to close chat
                            </span>
                        </div>
                    </Box>
                )}
                <Box mt={"auto"} className="all-messages">
                    {renderMessages.map((msg, i) => {
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
