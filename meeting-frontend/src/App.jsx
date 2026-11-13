
import { useState, useEffect } from "react";

import Sidebar from "./components/sidebar";
import ChatWindow from "./components/chatWindow";
import ChatInput from "./components/chatInput";
import VoiceChat from "./components/VoiceChat";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { sendMessage } from "./services/meetingApi";

import {
  CalendarDays,
  Sparkles,
  Sun,
  Moon,
  RefreshCw,
  Video,
  AlertCircle,
  Mic
} from "lucide-react";

import "./App.css";

export default function App() {

  // Theme management
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("meetingpilot-theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("meetingpilot-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(previous =>
        previous === "dark" ? "light" : "dark"
    );
  };

  // Page navigation
  const [activePage, setActivePage] = useState("chat");

  // Chat messages
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
          "Hello! I'm MeetingPilot AI. I can check availability, schedule meetings, generate Google Meet links and manage your calendar. What would you like to do?"
    }
  ]);

  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Voice chat state
  const [voiceOpen, setVoiceOpen] = useState(false);

  // Meetings page state
  const [meetings, setMeetings] = useState("");
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingsError, setMeetingsError] = useState("");
  const [meetingsConversationId, setMeetingsConversationId] = useState(null);

  // Existing chat API reused for both text and voice
  const handleSend = async (message) => {

    if (!message.trim() || loading) return null;

    setMessages(previous => [
      ...previous,
      {
        role: "user",
        content: message
      }
    ]);

    setLoading(true);

    try {
      const result = await sendMessage(
          message,
          conversationId
      );

      setConversationId(result.conversationId);

      setMessages(previous => [
        ...previous,
        {
          role: "assistant",
          content: result.response
        }
      ]);

      return result.response;

    } catch (error) {
      console.error("MeetingPilot API Error:", error);

      const errorMessage =
          error.response?.data?.message ||
          "Unable to connect to MeetingPilot.";

      setMessages(previous => [
        ...previous,
        {
          role: "assistant",
          content: errorMessage
        }
      ]);

      return null;

    } finally {
      setLoading(false);
    }
  };

  // Fetch all upcoming meetings
  const fetchMeetings = async () => {

    setMeetingsLoading(true);
    setMeetingsError("");

    try {

      const result = await sendMessage(
          "Show ALL my upcoming Google Calendar meetings for the next 7 days. Retrieve every matching event. Include meeting title, event ID, start time, end time and Google Meet link. Do not create, update or delete any event.",
          meetingsConversationId
      );

      setMeetingsConversationId(result.conversationId);
      setMeetings(result.response || "");

    } catch (error) {

      console.error("Meetings API Error:", error);

      setMeetingsError(
          error.response?.data?.message ||
          "Unable to load Google Calendar meetings."
      );

    } finally {
      setMeetingsLoading(false);
    }
  };

  // Load meetings when Meetings page opens
  useEffect(() => {

    if (activePage === "meetings") {
      fetchMeetings();
    }

  }, [activePage]);

  // Start new conversation
  const newChat = () => {

    if (loading) return;

    setConversationId(null);
    setActivePage("chat");
    setVoiceOpen(false);

    setMessages([
      {
        role: "assistant",
        content:
            "New conversation started! How can I help you?"
      }
    ]);
  };

  return (

      <div className="app-layout">

        {/* Sidebar */}
        <Sidebar
            onNewChat={newChat}
            activePage={activePage}
            onNavigate={setActivePage}
        />

        {/* Main Panel */}
        <main className="main-panel">

          {/* Header */}
          <header className="topbar">

            <div className="header-info">

              <h2>
                {activePage === "chat"
                    ? "AI Meeting Assistant"
                    : activePage === "meetings"
                        ? "My Meetings"
                        : "Settings"}
              </h2>

              <p>
                {activePage === "chat"
                    ? "Manage your meetings using natural language"
                    : activePage === "meetings"
                        ? "View your upcoming Google Calendar events"
                        : "Manage your MeetingPilot preferences"}
              </p>

            </div>

            <div className="header-actions">

              <div className="top-status">
                <span className="online-dot"></span>
                AI Assistant Online
              </div>

              {/* Voice Chat Button */}
              {activePage === "chat" && (
                  <button
                      type="button"
                      className="voice-mode-button"
                      onClick={() => setVoiceOpen(true)}
                      disabled={loading}
                  >
                    <Mic size={18} />
                    Voice Chat
                  </button>
              )}

              <button
                  type="button"
                  className="theme-toggle"
                  onClick={toggleTheme}
              >

                {theme === "dark"
                    ? <Sun size={19} />
                    : <Moon size={19} />
                }

                <span>
                {theme === "dark"
                    ? "Light Mode"
                    : "Dark Mode"}
              </span>

              </button>

            </div>

          </header>

          {/* CHAT PAGE */}
          {activePage === "chat" && (

              <>

                <section className="welcome">

                  <div className="welcome-icon">
                    <Sparkles size={25} />
                  </div>

                  <h1>
                    Your personal meeting assistant
                  </h1>

                  <p>
                    Schedule, organize and manage meetings
                    with the power of autonomous AI.
                  </p>

                  <div className="suggestions">

                    <button
                        onClick={() =>
                            handleSend(
                                "Show my upcoming meetings for the next 7 days"
                            )
                        }
                        disabled={loading}
                    >
                      <CalendarDays size={16} />
                      Show upcoming meetings
                    </button>

                    <button
                        onClick={() =>
                            handleSend(
                                "Find available meeting slots tomorrow"
                            )
                        }
                        disabled={loading}
                    >
                      Find available slots
                    </button>

                    <button
                        onClick={() =>
                            handleSend(
                                "Help me schedule a project meeting"
                            )
                        }
                        disabled={loading}
                    >
                      Schedule a meeting
                    </button>

                  </div>

                </section>

                <ChatWindow
                    messages={messages}
                    loading={loading}
                />

                <ChatInput
                    onSend={handleSend}
                    loading={loading}
                />

              </>

          )}

          {/* MEETINGS PAGE */}
          {activePage === "meetings" && (

              <section className="meetings-page">

                <div className="meetings-toolbar">

                  <div>
                    <h2>
                      <CalendarDays size={23} />
                      Upcoming Meetings
                    </h2>

                    <p>
                      Your Google Calendar events for the next 7 days
                    </p>
                  </div>

                  <button
                      className="refresh-btn"
                      onClick={fetchMeetings}
                      disabled={meetingsLoading}
                  >
                    <RefreshCw
                        size={17}
                        className={meetingsLoading ? "spin" : ""}
                    />
                    Refresh
                  </button>

                </div>

                {meetingsLoading && (

                    <div className="meetings-loading">
                      <RefreshCw className="spin" size={30} />
                      <p>Loading your meetings...</p>
                    </div>

                )}

                {meetingsError && (

                    <div className="meetings-error">
                      <AlertCircle size={20} />
                      {meetingsError}
                    </div>

                )}

                {!meetingsLoading && !meetingsError && (

                    <div className="meetings-result">

                      {meetings ? (

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
                                      <Video size={15} />
                                      {children}
                                    </a>
                                )
                              }}
                          >
                            {meetings}
                          </ReactMarkdown>

                      ) : (

                          <div className="empty-meetings">
                            <CalendarDays size={45} />
                            <h3>No upcoming meetings</h3>
                            <p>Your calendar is currently empty.</p>
                          </div>

                      )}

                    </div>

                )}

              </section>

          )}

          {/* SETTINGS PAGE */}
          {activePage === "settings" && (

              <section className="settings-page">

                <h2>Settings</h2>

                <p>Manage your MeetingPilot preferences.</p>

                <div className="settings-card">

                  <h3>Appearance</h3>

                  <p>Choose your preferred application theme.</p>

                  <button
                      className="theme-toggle"
                      onClick={toggleTheme}
                  >
                    {theme === "dark"
                        ? <Sun size={18} />
                        : <Moon size={18} />
                    }

                    {theme === "dark"
                        ? "Switch to Light Mode"
                        : "Switch to Dark Mode"}
                  </button>

                </div>

                <div className="settings-card">

                  <h3>Google Calendar</h3>

                  <p>
                    Calendar integration is managed through
                    your existing Google OAuth connection.
                  </p>

                </div>

                <div className="settings-card">

                  <h3>AI Assistant</h3>

                  <p>
                    Powered by Groq, Llama, Spring AI and MCP.
                  </p>

                </div>

              </section>

          )}

          {/* Footer */}
          <footer className="footer">
            Powered by Groq · Llama · Spring AI · MCP
          </footer>

        </main>

        {/* Voice Chat Modal */}
        {voiceOpen && (
            <VoiceChat
                onSend={handleSend}
                onClose={() => setVoiceOpen(false)}
            />
        )}

      </div>
  );
}
