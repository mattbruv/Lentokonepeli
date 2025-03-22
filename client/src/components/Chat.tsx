import { Flex } from "@mantine/core";
import { ChatMessage } from "dogfight-types/ChatMessage";
import { useState } from "react";
import "./Chat.css";

export type ChatProps = {
    messages: ChatMessage[];
};

export function Chat({ messages }: ChatProps) {
    const [message, setMessage] = useState("");

    return (
        <div className="chat">
            <Flex direction={"column"}>
                <div className="message">hi mom</div>
                <div className="all-messages">
                    {messages.map((msg, i) => {
                        const output = msg.sender_name + " " + msg.message;
                        return <div key={i}>{output.trim()}</div>;
                    })}
                </div>
            </Flex>
        </div>
    );
}
