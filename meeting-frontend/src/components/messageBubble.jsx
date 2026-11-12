
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User, ExternalLink } from "lucide-react";

export default function MessageBubble({ message }) {
    const isUser = message.role === "user";

    const content = (message.content || "")
        .replace(/\\n/g, "\n")
        .replace(/\r\n/g, "\n")
        .replace(/\\\n/g, "\n");

    return (
        <div className={`message-row ${isUser ? "user" : "assistant"}`}>
            <div className="avatar">
                {isUser ? <User size={19} /> : <Bot size={19} />}
            </div>

            <div className="message-content">
                <div className="message-name">
                    {isUser ? "You" : "MeetingPilot AI"}
                </div>

                <div className="message-text">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            table: ({ children }) => (
                                <div className="meeting-table-wrapper">
                                    <table className="meeting-details-table">
                                        {children}
                                    </table>
                                </div>
                            ),
                            a: ({ href, children }) => (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="meeting-link"
                                >
                                    {children}
                                    <ExternalLink size={14} />
                                </a>
                            )
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
