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

export type ChatProps = {
    messages: ChatMessage[];
    onSendMessage: (message: string, isGlobal: boolean) => void;
};

export function Chat({ messages, onSendMessage }: ChatProps) {
    const [message, setMessage] = useState("");
    const { globalState } = useSettingsContext();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();

            if (key === "enter") {
                event.preventDefault(); // Prevents default browser behavior
                if (message) {
                    onSendMessage(message, true);
                    setMessage("");
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [message, globalState.chatState]);

    function getChatClass(): string {
        if (globalState.chatState != ChatMode.Passive) {
            return "chat active";
        }
        return "chat";
    }

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
                    {messages.map((msg, i) => {
                        const msgClass = (!msg.private ? "global" : "private") + " message";
                        const output = msg.sender_name + ": " + msg.message;
                        return (
                            <div className={msgClass} key={i}>
                                {output.trim()}
                            </div>
                        );
                    })}
                </Box>
            </Flex>
        </div>
    );
}
