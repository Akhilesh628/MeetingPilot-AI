# MeetingPilot AI --- Dashboard Screenshots & UI Documentation

This document describes the six MeetingPilot AI application screenshots
supplied for the project. It can be saved in the repository as
`docs/SCREENSHOTS.md`.

## 1. Application overview

MeetingPilot AI is a web-based meeting assistant interface. The supplied
screenshots show the main chat dashboard, upcoming Google Calendar
meetings, application settings, dark theme, a text-chat conversation,
and the full-screen voice assistant.

**Frontend address shown:** `http://localhost:5175`

## 2. Screenshots

> Image paths below assume the screenshots are copied into
> `docs/images/` using the filenames shown. Keep the filenames
> consistent with these Markdown references.

### 2.1 AI Assistant --- Main Dashboard

**Suggested image filename:** `meetingpilot-dashboard.png`

![MeetingPilot AI main dashboard](images/meetingpilot-dashboard.png)

The main dashboard includes:

-   A left navigation sidebar with **New conversation**, **AI
    Assistant**, **Meetings**, and **Settings**.
-   A top header titled **AI Meeting Assistant**.
-   An online-status indicator labelled **AI Assistant Online**.
-   A **Voice Chat** action.
-   A light/dark theme toggle.
-   A welcome area introducing MeetingPilot as a personal meeting
    assistant.
-   Quick-action prompts for showing upcoming meetings, finding
    available slots, and scheduling a meeting.
-   A chat conversation area with the assistant greeting.
-   A message input at the bottom for natural-language requests.

### 2.2 My Meetings --- Upcoming Calendar Events

**Suggested image filename:** `meetingpilot-meetings.png`

![MeetingPilot AI upcoming meetings
page](images/meetingpilot-meetings.png)

The Meetings page displays upcoming Google Calendar events for the next
seven days.

Visible interface elements include:

-   The **My Meetings** page heading.
-   An **Upcoming Meetings** section.
-   A description indicating that events are retrieved from Google
    Calendar.
-   A **Refresh** button.
-   A meeting table with columns for:
    -   Meeting Title
    -   Event ID
    -   Date
    -   Start Time
    -   End Time
    -   Google Meet
-   A Google Meet link for the displayed event.
-   A message indicating when no additional meetings are scheduled in
    the displayed period.

The supplied screenshot shows one event titled **Sprint Planning**,
dated `2026-11-15`, with a Google Meet link.

### 2.3 Settings --- Application Preferences

**Suggested image filename:** `meetingpilot-settings.png`

![MeetingPilot AI settings page](images/meetingpilot-settings.png)

The Settings page contains preference and integration information in
separate sections:

-   **Appearance:** explains the application theme preference and
    provides a button to switch to Dark Mode.
-   **Google Calendar:** states that calendar integration is managed
    through the existing Google OAuth connection.
-   **AI Assistant:** identifies Groq, Llama, Spring AI, and MCP as the
    technologies powering the assistant.

The sidebar provides navigation back to AI Assistant and Meetings.

### 2.4 AI Assistant --- Dark Theme

**Suggested image filename:** `meetingpilot-dark-mode.png`

![MeetingPilot AI dark theme](images/meetingpilot-dark-mode.png)

The dark-theme screenshot shows the AI Assistant dashboard using a dark
colour palette.

Visible elements include:

-   A dark sidebar and dark application workspace.
-   The AI Meeting Assistant header.
-   The online-status indicator.
-   The Voice Chat button.
-   A **Light Mode** toggle, indicating that dark mode is active.
-   The welcome message and quick-action prompts.
-   Assistant and user message bubbles using contrasting dark and blue
    backgrounds.
-   The chat input and send control at the bottom.

### 2.5 AI Assistant --- Text Conversation

**Suggested image filename:** `meetingpilot-chat-conversation.png`

![MeetingPilot AI text
conversation](images/meetingpilot-chat-conversation.png)

This screenshot demonstrates a text-based interaction in dark mode.

The visible conversation includes:

-   A user request: **"Find available meeting slots tomorrow"**.
-   An assistant response asking for the meeting duration and time zone
    before searching.
-   A scrollable conversation area.
-   The message input and send button.

This demonstrates the conversational clarification flow. The screenshot
does not show the final availability results.

### 2.6 Voice Chat --- Full-Screen Voice Assistant

**Suggested image filename:** `meetingpilot-voice-chat.png`

![MeetingPilot AI full-screen voice
assistant](images/meetingpilot-voice-chat.png)

The voice interface is displayed as a full-screen experience, separate
from the standard dashboard layout.

Visible elements include:

-   MeetingPilot AI branding and the **Real-time Voice Assistant**
    subtitle.
-   A close button in the header.
-   A large central microphone orb.
-   The status **Ready to talk**.
-   A short instruction inviting the user to start a conversation.
-   An animated waveform-style visual.
-   A **Latest conversation** transcript area.
-   A language selector showing **English (India)** in the supplied
    screenshot.
-   A **Start conversation** button.
-   A footer identifying Groq, Spring AI, and Google Calendar MCP.

The screenshot shows the voice assistant in its ready state; it does not
by itself demonstrate an active recording or completed voice
interaction.

## 3. Suggested repository layout

Copy the six supplied screenshot files into the frontend-independent
documentation folder at the repository root:

``` text
MeetingPilot-AI/
├── calendar-mcp-server/
├── meeting-agent/
├── meeting-frontend/
├── docs/
│   ├── SCREENSHOTS.md
│   └── images/
│       ├── meetingpilot-dashboard.png
│       ├── meetingpilot-meetings.png
│       ├── meetingpilot-settings.png
│       ├── meetingpilot-dark-mode.png
│       ├── meetingpilot-chat-conversation.png
│       └── meetingpilot-voice-chat.png
├── .gitignore
└── pom.xml
```

## 4. Add the documentation and screenshots to Git

From the repository root, run:

``` bash
git add docs/SCREENSHOTS.md docs/images/
git commit -m "Add MeetingPilot UI screenshots and documentation"
git push origin main
```

After pushing, open the GitHub repository and view
`docs/SCREENSHOTS.md`. GitHub renders the Markdown and displays the
screenshots when the image files are present at the referenced paths.

## 5. Screenshot and privacy notes

Before publishing screenshots, review them for information that should
not be public. In particular:

-   Remove or blur private meeting titles and attendee details if
    necessary.
-   Avoid publishing personal email addresses, OAuth credentials, access
    tokens, or other secrets.
-   Check that calendar event IDs and meeting links are safe to expose
    publicly.
-   The screenshots document the visible UI only; they do not prove that
    every described or planned feature is fully implemented.
