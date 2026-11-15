
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

  // =====================================
  // THEME MANAGEMENT
  // =====================================

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

  // =====================================
  // PAGE NAVIGATION
  // =====================================

  const [activePage, setActivePage] = useState("chat");

  // =====================================
  // CHAT MESSAGES
  // =====================================

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
          "Hello! I'm MeetingPilot AI. I can check availability, schedule meetings, generate Google Meet links and manage your calendar. What would you like to do?"
    }
  ]);

  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);

  // =====================================
  // VOICE CHAT STATE
  // =====================================

  const [voiceOpen, setVoiceOpen] = useState(false);

  // =====================================
  // MEETINGS PAGE STATE
  // =====================================

  const [meetings, setMeetings] = useState("");
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingsError, setMeetingsError] = useState("");
  const [meetingsConversationId, setMeetingsConversationId] = useState(null);

  // =====================================
  // DETECT UPCOMING MEETING REQUEST
  // =====================================

  const isUpcomingMeetingRequest = (message) => {

    const normalizedMessage = message.toLowerCase();

    return (
        normalizedMessage.includes("upcoming meetings") ||
        normalizedMessage.includes("upcoming meeting") ||
        normalizedMessage.includes("show my meetings") ||
        normalizedMessage.includes("show all meetings") ||
        normalizedMessage.includes("next 7 days meetings") ||
        normalizedMessage.includes("calendar meetings")
    );
  };

  // =====================================
  // CHAT API
  // =====================================

  const handleSend = async (message) => {

    if (!message.trim() || loading) return null;

    // Add user message
    setMessages(previous => [
      ...previous,
      {
        role: "user",
        content: message
      }
    ]);

    setLoading(true);

    try {

      let apiMessage = message;

      // =====================================
      // UPCOMING MEETINGS PROMPT
      // =====================================

      if (isUpcomingMeetingRequest(message)) {

        apiMessage = `
                    Retrieve ALL upcoming meetings from my
                    Google Calendar for the next 7 days.

                    IMPORTANT:
                    Return every matching meeting.

                    REQUIRED RESPONSE FORMAT:

                    Success: true or false

                    Display a Markdown table with exactly
                    these columns:

                    | Meeting Title | Event ID | Start Date and Time | End Date and Time | Google Meet Link |

                    COLUMN REQUIREMENTS:

                    1. Meeting Title:
                       Return the actual Google Calendar event title.

                    2. Event ID:
                       Return the actual Google Calendar event ID.

                    3. Start Date and Time:
                       Return the actual event start date and time.

                    4. End Date and Time:
                       Return the actual event end date and time.

                    5. Google Meet Link:
                       Return the actual clickable Google Meet URL.

                    IMPORTANT RULES:

                    - Return ALL upcoming meetings.
                    - Each meeting must have a separate table row.
                    - Never combine multiple meetings into one row.
                    - Include all five columns.
                    - Use actual Google Calendar event information.
                    - Convert date and time to Asia/Kolkata timezone.
                    - Display date and time clearly.
                    - Include clickable Google Meet URLs.
                    - Never assume meeting duration.
                    - Never invent missing end times.
                    - Never invent missing event IDs.
                    - If a field is unavailable, show Not available.
                    - If no meetings exist, clearly explain that.
                    - Do not create any meeting.
                    - Do not update any meeting.
                    - Do not delete any meeting.

                    AFTER THE TABLE:

                    Display:

                    Response Message:
                    A clear summary of the meeting retrieval operation.

                    Return the complete response in Markdown format.
                `;
      }

      // =====================================
      // CALL MEETINGPILOT BACKEND
      // =====================================

      const result = await sendMessage(
          apiMessage,
          conversationId
      );

      // Save conversation ID
      if (result.conversationId) {
        setConversationId(result.conversationId);
      }

      // Get AI response
      const assistantResponse =
          result.response ||
          result.message ||
          "The assistant returned an empty response.";

      // Add assistant response to chat
      setMessages(previous => [
        ...previous,
        {
          role: "assistant",
          content: assistantResponse
        }
      ]);

      return assistantResponse;

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

  // =====================================
  // FETCH ALL UPCOMING MEETINGS
  // FOR SEPARATE MEETINGS PAGE
  // =====================================

  const fetchMeetings = async () => {

    setMeetingsLoading(true);
    setMeetingsError("");

    try {

      const result = await sendMessage(
          `
                Show ALL my upcoming Google Calendar meetings
                for the next 7 days.

                Include:

                | Meeting Title | Event ID | Start Date and Time | End Date and Time | Google Meet Link |

                Requirements:

                - Return every matching meeting.
                - Include actual event IDs.
                - Include actual start date and time.
                - Include actual end date and time.
                - Include actual Google Meet links.
                - Convert date and time to Asia/Kolkata.
                - Use Markdown table format.
                - Never assume meeting duration.
                - Never invent missing information.
                - Do not create, update or delete meetings.
                `,
          meetingsConversationId
      );

      if (result.conversationId) {
        setMeetingsConversationId(result.conversationId);
      }

      setMeetings(
          result.response ||
          result.message ||
          ""
      );

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

  // =====================================
  // LOAD MEETINGS WHEN PAGE OPENS
  // =====================================

  useEffect(() => {

    if (activePage === "meetings") {
      fetchMeetings();
    }

  }, [activePage]);

  // =====================================
  // START NEW CONVERSATION
  // =====================================

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

  // =====================================
  // MAIN UI
  // =====================================

  return (

      <div className="app-layout">

        {/* SIDEBAR */}

        <Sidebar
            onNewChat={newChat}
            activePage={activePage}
            onNavigate={setActivePage}
        />

        {/* MAIN PANEL */}

        <main className="main-panel">

          {/* HEADER */}

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

              {/* VOICE CHAT BUTTON */}

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

              {/* THEME TOGGLE */}

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

          {/* =====================================
                    CHAT PAGE
                ===================================== */}

          {activePage === "chat" && (

              <>

                {/* WELCOME SECTION */}

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

                  {/* SUGGESTIONS */}

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

                {/* CHAT WINDOW */}

                <ChatWindow
                    messages={messages}
                    loading={loading}
                />

                {/* CHAT INPUT */}

                <ChatInput
                    onSend={handleSend}
                    loading={loading}
                />

              </>

          )}

          {/* =====================================
                    MEETINGS PAGE
                ===================================== */}

          {activePage === "meetings" && (

              <section className="meetings-page">

                {/* MEETINGS HEADER */}

                <div className="meetings-toolbar">

                  <div>

                    <h2>
                      <CalendarDays size={23} />
                      Upcoming Meetings
                    </h2>

                    <p>
                      Your Google Calendar events
                      for the next 7 days
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

                {/* LOADING */}

                {meetingsLoading && (

                    <div className="meetings-loading">

                      <RefreshCw
                          className="spin"
                          size={30}
                      />

                      <p>
                        Loading your meetings...
                      </p>

                    </div>

                )}

                {/* ERROR */}

                {meetingsError && (

                    <div className="meetings-error">

                      <AlertCircle size={20} />

                      {meetingsError}

                    </div>

                )}

                {/* MEETING RESULTS */}

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

                                ),

                                table: ({ children }) => (

                                    <div className="meeting-table-wrapper">

                                      <table className="meeting-details-table">
                                        {children}
                                      </table>

                                    </div>

                                )

                              }}
                          >
                            {meetings}
                          </ReactMarkdown>

                      ) : (

                          <div className="empty-meetings">

                            <CalendarDays size={45} />

                            <h3>
                              No upcoming meetings
                            </h3>

                            <p>
                              Your calendar is currently empty.
                            </p>

                          </div>

                      )}

                    </div>

                )}

              </section>

          )}

          {/* =====================================
                    SETTINGS PAGE
                ===================================== */}

          {activePage === "settings" && (

              <section className="settings-page">

                <h2>Settings</h2>

                <p>
                  Manage your MeetingPilot preferences.
                </p>

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

          {/* FOOTER */}

          <footer className="footer">
            Powered by Groq · Llama · Spring AI · MCP
          </footer>

        </main>

        {/* VOICE CHAT MODAL */}

        {voiceOpen && (

            <VoiceChat
                onSend={handleSend}
                onClose={() => setVoiceOpen(false)}
            />

        )}

      </div>

  );

}
