
import React from "react";
import {
    Bot,
    CalendarDays,
    Settings,
    Plus,
    Info
} from "lucide-react";

export default function Sidebar({
                                    onNewChat,
                                    activePage,
                                    onNavigate
                                }) {
    return (
        <aside className="sidebar">

            {/* Desktop Brand */}
            <div className="brand">
                <Bot size={28} />
                <span>MeetingPilot</span>
            </div>

            {/* Desktop New Conversation */}
            <button
                className="new-chat"
                onClick={onNewChat}
            >
                <Plus size={18} />
                New conversation
            </button>

            {/* Mobile New Conversation */}
            <button
                className="mobile-new-chat"
                onClick={onNewChat}
                title="New conversation"
                aria-label="New conversation"
            >
                <Plus size={21} />
            </button>

            {/* Navigation */}
            <div className="sidebar-links">

                <button
                    className={`nav-item ${activePage === "chat" ? "active" : ""}`}
                    onClick={() => onNavigate("chat")}
                >
                    <Bot size={19} />
                    <span>AI Assistant</span>
                </button>

                <button
                    className={`nav-item ${activePage === "meetings" ? "active" : ""}`}
                    onClick={() => onNavigate("meetings")}
                >
                    <CalendarDays size={19} />
                    <span>Meetings</span>
                </button>

                <button
                    className={`nav-item ${activePage === "settings" ? "active" : ""}`}
                    onClick={() => onNavigate("settings")}
                >
                    <Settings size={19} />
                    <span>Settings</span>
                </button>

                <button
                    className={`nav-item ${activePage === "about" ? "active" : ""}`}
                    onClick={() => onNavigate("about")}
                >
                    <Info size={19} />
                    <span>About</span>
                </button>

            </div>

        </aside>
    );
}
