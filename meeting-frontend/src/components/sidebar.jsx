
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

            <div className="brand">
                <Bot size={28} />
                <span>MeetingPilot</span>
            </div>

            <button
                className="new-chat"
                onClick={onNewChat}
            >
                <Plus size={18} />
                New conversation
            </button>

            <div className="sidebar-links">

                <button
                    className={`nav-item ${activePage === "chat" ? "active" : ""}`}
                    onClick={() => onNavigate("chat")}
                >
                    <Bot size={18} />
                    AI Assistant
                </button>

                <button
                    className={`nav-item ${activePage === "meetings" ? "active" : ""}`}
                    onClick={() => onNavigate("meetings")}
                >
                    <CalendarDays size={18} />
                    Meetings
                </button>

                <button
                    className={`nav-item ${activePage === "settings" ? "active" : ""}`}
                    onClick={() => onNavigate("settings")}
                >
                    <Settings size={18} />
                    Settings
                </button>

                <button
                    className={`nav-item ${activePage === "about" ? "active" : ""}`}
                    onClick={() => onNavigate("about")}
                >
                    <Info size={18} />
                    About
                </button>

            </div>
        </aside>
    );
}
