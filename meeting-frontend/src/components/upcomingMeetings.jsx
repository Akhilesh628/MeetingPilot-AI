
import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    CalendarDays,
    RefreshCw,
    Clock,
    Video,
    AlertCircle
} from "lucide-react";

export default function UpcomingMeetings() {

    const [meetings, setMeetings] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchMeetings = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.post(
                "/api/meetings/chat",
                {
                    message: `
                        List ALL upcoming meetings from my Google Calendar.

                        Include for every meeting:
                        Meeting Title, Event ID, Date, Start Time,
                        End Time, Attendees and Google Meet Link.

                        Do not create, update or delete meetings.
                        If there are no meetings, clearly say so.
                        Return every meeting, not just the first one.
                    `
                }
            );

            const result = response.data;

            setMeetings(
                typeof result === "string"
                    ? result
                    : result?.response || result?.message || ""
            );

        } catch (err) {
            console.error("Meeting fetch error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load meetings. Please check your backend and Google Calendar connection."
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, []);

    return (
        <div className="meetings-page">

            <div className="meetings-header">
                <div>
                    <h1>
                        <CalendarDays size={25} />
                        My Meetings
                    </h1>
                    <p>All your upcoming Google Calendar meetings</p>
                </div>

                <button
                    className="refresh-btn"
                    onClick={fetchMeetings}
                    disabled={loading}
                >
                    <RefreshCw
                        size={17}
                        className={loading ? "spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {loading && (
                <div className="meeting-loading">
                    <RefreshCw className="spin" size={28} />
                    <p>Loading your Google Calendar meetings...</p>
                </div>
            )}

            {error && (
                <div className="meeting-error">
                    <AlertCircle size={20} />
                    {error}
                    <button onClick={fetchMeetings}>
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && (
                <div className="meetings-list">
                    <div className="meetings-section-title">
                        <Clock size={19} />
                        Upcoming Meetings
                    </div>

                    {meetings ? (
                        <div className="meeting-result">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    a: ({ href, children }) => (
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="meeting-link"
                                        >
                                            <Video size={16} />
                                            {children}
                                        </a>
                                    )
                                }}
                            >
                                {meetings}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="empty-meetings">
                            <CalendarDays size={45} />
                            <h3>No meetings found</h3>
                            <p>Your upcoming meetings will appear here.</p>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
