
import MessageBubble from "./MessageBubble";
import { useEffect, useRef } from "react";

export default function ChatWindow({ messages, loading }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, loading]);

    return (
        <div className="chat-window">
            {messages.map((message, index) => (
                <MessageBubble
                    key={index}
                    message={message}
                />
            ))}

            {loading && (
                <div className="typing">
                    <span></span>
                    <span></span>
                    <span></span>
                    MeetingPilot is thinking...
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
}
