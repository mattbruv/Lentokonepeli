import { Box, Flex, Stack, TextInput } from "@mantine/core";
import { ChatMessage } from "dogfight-types/ChatMessage";
import { useEffect, useState } from "react";
import "./Chat.css";

export type ChatProps = {
    messages: ChatMessage[];
    onSendMessage: (message: string, isGlobal: boolean) => void;
};

export function Chat({ messages, onSendMessage }: ChatProps) {
    const [message, setMessage] = useState("");

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
    }, [message]);

    return (
        <div className="chat active">
            <Flex direction={"column"} h={"100%"}>
                <Box className="message">
                    <TextInput
                        onChange={(event) => setMessage(event.target.value)}
                        value={message}
                        placeholder={"Send a message..."}
                    />
                </Box>
                {message}
                <Stack mt={"auto"} className="all-messages">
                    {messages.map((msg, i) => {
                        const msgClass = (!msg.private ? "global" : "private") + " message";
                        const output = msg.sender_name + " " + msg.message;
                        return (
                            <div className={msgClass} key={i}>
                                {output.trim()}
                            </div>
                        );
                    })}
                </Stack>
            </Flex>
        </div>
    );
}
