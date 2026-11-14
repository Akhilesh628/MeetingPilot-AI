
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Bot,
    User,
    ThumbsUp,
    ThumbsDown
} from "lucide-react";

export default function MessageBubble({ message }) {

    const isUser = message.role === "user";

    const [feedback, setFeedback] = useState(null);

    const formatMessageTime = (timestamp) => {
        if (!timestamp) return "";

        const date = new Date(timestamp);

        if (isNaN(date.getTime())) return "";

        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };

    const handleFeedback = (type) => {
        setFeedback(previous =>
            previous === type ? null : type
        );

        // Optional: send feedback to backend later
        console.log("Message feedback:", {
            message: message.content,
            feedback: type
        });
    };

    return (
        <div className={`message-row ${isUser ? "user" : "assistant"}`}>

            {/* Avatar */}
            <div className="message-avatar">
                {isUser ? (
                    <User size={18} />
                ) : (
                    <Bot size={18} />
                )}
            </div>

            <div className="message-content">

                {/* Sender */}
                <div className="message-sender">
                    {isUser ? "You" : "MeetingPilot AI"}
                </div>

                {/* Message */}
                <div className={`message-bubble ${isUser ? "user" : "assistant"}`}>

                    {isUser ? (
                        message.content
                    ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content || ""}
                        </ReactMarkdown>
                    )}

                </div>

                {/* Like / Dislike - Only AI Messages */}
                {!isUser && (
                    <div className="message-feedback">

                        <button
                            type="button"
                            className={`feedback-button ${
                                feedback === "like" ? "selected" : ""
                            }`}
                            onClick={() => handleFeedback("like")}
                            aria-label="Like response"
                            title="Good response"
                        >
                            <ThumbsUp size={18} />
                        </button>

                        <button
                            type="button"
                            className={`feedback-button ${
                                feedback === "dislike" ? "selected" : ""
                            }`}
                            onClick={() => handleFeedback("dislike")}
                            aria-label="Dislike response"
                            title="Bad response"
                        >
                            <ThumbsDown size={18} />
                        </button>

                    </div>
                )}

                {/* Timestamp */}
                <div className="message-time">
                    {formatMessageTime(message.timestamp)}
                </div>

            </div>

        </div>
    );
}
