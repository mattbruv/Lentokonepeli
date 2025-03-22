import { useState } from "react";
import "./Chat.css";

export type ChatProps = {};

export function Chat({}: ChatProps) {
    const [message, setMessage] = useState("");

    return (
        <div className="chat">
            <div className="message">hi mom</div>
            <div className="all-messages">
                <div>Foo: bar</div>
                <div>Bar: baz</div>
            </div>
        </div>
    );
}
