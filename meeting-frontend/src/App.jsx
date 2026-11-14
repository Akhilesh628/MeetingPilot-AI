
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
  Mic,
  Menu,
  X,
  Bot,
  Info
} from "lucide-react";

import "./App.css";

export default function App() {

  // ==========================================
  // THEME MANAGEMENT
  // ==========================================

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

  // ==========================================
  // PAGE NAVIGATION
  // ==========================================

  const [activePage, setActivePage] = useState("chat");

  // Mobile sidebar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigate = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  // ==========================================
  // CHAT MESSAGES
  // ==========================================

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
          "Hello! I'm MeetingPilot AI. I can check availability, schedule meetings, generate Google Meet links and manage your calendar. What would you like to do?"
    }
  ]);

  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // VOICE CHAT
  // ==========================================

  const [voiceOpen, setVoiceOpen] = useState(false);

  // ==========================================
  // MEETINGS PAGE STATE
  // ==========================================

  const [meetings, setMeetings] = useState("");
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingsError, setMeetingsError] = useState("");
  const [meetingsConversationId, setMeetingsConversationId] =
      useState(null);

  // ==========================================
  // SEND CHAT MESSAGE
  // ==========================================

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

  // ==========================================
  // FETCH UPCOMING MEETINGS
  // ==========================================

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

  // ==========================================
  // START NEW CONVERSATION
  // ==========================================

  const newChat = () => {

    if (loading) return;

    setConversationId(null);
    setActivePage("chat");
    setMobileMenuOpen(false);
    setVoiceOpen(false);

    setMessages([
      {
        role: "assistant",
        content:
            "New conversation started! How can I help you?"
      }
    ]);
  };

  // ==========================================
  // RENDER UI
  // ==========================================

  return (

      <div
          className={`app-layout ${
              mobileMenuOpen ? "mobile-menu-open" : ""
          }`}
      >

        {/* MOBILE SIDEBAR BACKDROP */}

        {mobileMenuOpen && (
            <button
                type="button"
                className="sidebar-backdrop"
                aria-label="Close navigation menu"
                onClick={() => setMobileMenuOpen(false)}
            />
        )}

        {/* SIDEBAR */}

        <Sidebar
            onNewChat={newChat}
            activePage={activePage}
            onNavigate={handleNavigate}
        />

        {/* MAIN PANEL */}

        <main className="main-panel">

          {/* ==================================
                    HEADER
                ================================== */}

          <header className="topbar">

            {/* Mobile Hamburger */}

            <button
                type="button"
                className="mobile-menu-toggle"
                onClick={() =>
                    setMobileMenuOpen(open => !open)
                }
                aria-label={
                  mobileMenuOpen
                      ? "Close navigation menu"
                      : "Open navigation menu"
                }
                aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen
                  ? <X size={22} />
                  : <Menu size={22} />
              }
            </button>

            <div className="header-info">

              <h2>
                {activePage === "chat"
                    ? "AI Meeting Assistant"
                    : activePage === "meetings"
                        ? "My Meetings"
                        : activePage === "settings"
                            ? "Settings"
                            : "About MeetingPilot"}
              </h2>

              <p>
                {activePage === "chat"
                    ? "Manage your meetings using natural language"
                    : activePage === "meetings"
                        ? "View your upcoming Google Calendar events"
                        : activePage === "settings"
                            ? "Manage your MeetingPilot preferences"
                            : "Learn more about MeetingPilot AI"}
              </p>

            </div>

            <div className="header-actions">

              {/* Online Status */}

              <div className="top-status">
                <span className="online-dot"></span>
                AI Assistant Online
              </div>

              {/* Voice Chat */}

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

              {/* Theme Toggle */}

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

          {/* ==================================
                    CHAT PAGE
                ================================== */}

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

          {/* ==================================
                    MEETINGS PAGE
                ================================== */}

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
                        className={
                          meetingsLoading ? "spin" : ""
                        }
                    />
                    Refresh
                  </button>

                </div>

                {meetingsLoading && (
                    <div className="meetings-loading">

                      <RefreshCw
                          className="spin"
                          size={30}
                      />

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

                            <p>
                              Your calendar is currently empty.
                            </p>

                          </div>

                      )}

                    </div>

                )}

              </section>

          )}

          {/* ==================================
                    SETTINGS PAGE
                ================================== */}

          {activePage === "settings" && (

              <section className="settings-page">

                <h2>Settings</h2>

                <p>
                  Manage your MeetingPilot preferences.
                </p>

                {/* Appearance */}

                <div className="settings-card">

                  <h3>Appearance</h3>

                  <p>
                    Choose your preferred application theme.
                  </p>

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
                        : "Switch to Dark Mode"
                    }

                  </button>

                </div>

                {/* Google Calendar */}

                <div className="settings-card">

                  <h3>Google Calendar</h3>

                  <p>
                    Calendar integration is managed through
                    your existing Google OAuth connection.
                  </p>

                </div>

                {/* AI Assistant */}

                <div className="settings-card">

                  <h3>AI Assistant</h3>

                  <p>
                    Powered by Groq, Llama, Spring AI and MCP.
                  </p>

                </div>

              </section>

          )}

          {/* ==================================
                    ABOUT PAGE
                ================================== */}

          {activePage === "about" && (

              <section className="about-page">

                {/* About Hero */}

                <div className="about-hero">

                  <div className="about-icon">
                    <Bot size={35} />
                  </div>

                  <h1>About MeetingPilot AI</h1>

                  <p>
                    Your intelligent AI-powered meeting
                    assistant to schedule, organize and
                    manage meetings.
                  </p>

                </div>

                {/* Application Information */}

                <div className="about-card">

                  <h3>
                    <Info size={19} />
                    Application Information
                  </h3>

                  <div className="about-info-row">
                    <span>Application Name</span>
                    <strong>MeetingPilot AI</strong>
                  </div>

                  <div className="about-info-row">
                    <span>Version</span>
                    <strong>1.0.0</strong>
                  </div>

                  <div className="about-info-row">
                    <span>Application Type</span>
                    <strong>Autonomous AI Assistant</strong>
                  </div>

                  <div className="about-info-row">
                    <span>Platform</span>
                    <strong>Web Application</strong>
                  </div>

                </div>

                {/* Technology Stack */}

                <div className="about-card">

                  <h3>Technology Stack</h3>

                  <div className="tech-list">

                    {[
                      "Java 21",
                      "Spring Boot 4",
                      "Spring AI 2.0.2",
                      "React + Vite",
                      "Groq AI",
                      "Llama Model",
                      "Model Context Protocol",
                      "Google Calendar API",
                      "PostgreSQL",
                      "PGVector"
                    ].map(technology => (

                        <span
                            className="tech-badge"
                            key={technology}
                        >
                                        {technology}
                                    </span>

                    ))}

                  </div>

                </div>

                {/* Key Features */}

                <div className="about-card">

                  <h3>Key Features</h3>

                  <ul className="about-features">

                    <li>
                      AI-powered meeting scheduling
                    </li>

                    <li>
                      Google Calendar integration
                    </li>

                    <li>
                      Upcoming meeting management
                    </li>

                    <li>
                      Meeting availability checking
                    </li>

                    <li>
                      Google Meet link generation
                    </li>

                    <li>
                      Voice-based AI conversations
                    </li>

                    <li>
                      Autonomous AI agent using MCP
                    </li>

                  </ul>

                </div>

                {/* About Footer */}

                <div className="about-footer">

                  <div className="about-footer-icon">
                    <Bot size={25} />
                  </div>

                  <h3>MeetingPilot AI</h3>

                  <p>
                    Smart Meetings. Intelligent Automation.
                  </p>

                  <span>
                                Powered by Groq · Llama · Spring AI · MCP
                            </span>

                </div>

              </section>

          )}

          {/* ==================================
                    FOOTER
                ================================== */}

          <footer className="footer">
            Powered by Groq · Llama · Spring AI · MCP
          </footer>

        </main>

        {/* ==================================
                VOICE CHAT MODAL
            ================================== */}

        {voiceOpen && (
            <VoiceChat
                onSend={handleSend}
                onClose={() => setVoiceOpen(false)}
            />
        )}

      </div>
  );
}
