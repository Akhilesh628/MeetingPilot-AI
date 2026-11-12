
import { Send } from "lucide-react";
import { useState } from "react";

export default function ChatInput({ onSend, loading }) {
    const [message, setMessage] = useState("");

    const submit = () => {
        if (!message.trim() || loading) return;

        onSend(message.trim());
        setMessage("");
    };

    return (
        <div className="chat-input">
            <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submit();
                    }
                }}
                placeholder="Ask MeetingPilot to schedule a meeting..."
            />

            <button onClick={submit} disabled={loading}>
                <Send size={19} />
            </button>
        </div>
    );
}
