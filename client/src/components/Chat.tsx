import { Box, Flex, Stack } from "@mantine/core";
import { ChatMessage } from "dogfight-types/ChatMessage";
import { useState } from "react";
import "./Chat.css";

export type ChatProps = {
    messages: ChatMessage[];
};

export function Chat({ messages }: ChatProps) {
    const [message, setMessage] = useState("");

    return (
        <div className="chat active">
            <Flex direction={"column"} h={"100%"}>
                <Box className="message">hi mom</Box>
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
