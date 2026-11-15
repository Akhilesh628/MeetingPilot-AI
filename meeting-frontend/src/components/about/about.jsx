
import React, { useState } from "react";
import {
    Bot,
    CalendarDays,
    Brain,
    Mic,
    ShieldCheck,
    Code2,
    Sparkles,
    Video,
    Database,
    Zap,
    Globe,
    X,
    CheckCircle2,
} from "lucide-react";

import "./about.css";

const About = () => {
    const [selectedFeature, setSelectedFeature] = useState(null);

    // Application Information
    const infoCards = [
        {
            id: "app-name",
            icon: Bot,
            title: "Application Name",
            value: "MeetingPilot AI",
            details:
                "MeetingPilot AI is an intelligent autonomous meeting assistant designed to simplify meeting scheduling and calendar management.",
            capabilities: [
                "AI-powered meeting assistant.",
                "Natural language interaction.",
                "Automated meeting management.",
                "Google Calendar integration.",
            ],
        },
        {
            id: "version",
            icon: Code2,
            title: "Version",
            value: "1.0.0",
            details:
                "MeetingPilot AI version 1.0.0 provides AI-powered meeting management with calendar integration and voice interaction.",
            capabilities: [
                "AI assistant functionality.",
                "Meeting scheduling.",
                "Voice interaction.",
                "MCP tool integration.",
            ],
        },
        {
            id: "app-type",
            icon: Brain,
            title: "Application Type",
            value: "Autonomous AI Assistant",
            details:
                "MeetingPilot is an autonomous AI-powered application that uses Spring AI and MCP to perform supported meeting-related operations.",
            capabilities: [
                "Intelligent AI conversations.",
                "Autonomous tool execution.",
                "Contextual responses.",
                "Meeting workflow automation.",
            ],
        },
        {
            id: "platform",
            icon: Globe,
            title: "Platform",
            value: "Web Application",
            details:
                "MeetingPilot AI is a web application with a React frontend and Java Spring Boot backend.",
            capabilities: [
                "React and Vite frontend.",
                "Java 21 backend.",
                "Spring Boot 4.",
                "Responsive web interface.",
            ],
        },
    ];


    // Key Features
    const features = [
        {
            id: "ai",
            icon: Brain,
            title: "AI-Powered Assistant",
            description:
                "Interact with an intelligent AI assistant to manage meetings using natural language.",
            details:
                "MeetingPilot AI understands natural language requests and helps you manage your meetings through conversational AI.",
            capabilities: [
                "Ask questions using natural language.",
                "Get intelligent responses from the AI assistant.",
                "Find available meeting slots.",
                "Schedule meetings through chat.",
                "Retrieve upcoming calendar events.",
            ],
        },
        {
            id: "calendar",
            icon: CalendarDays,
            title: "Google Calendar Integration",
            description:
                "Connect your Google Calendar and manage upcoming meetings from one place.",
            details:
                "MeetingPilot connects with Google Calendar through OAuth authentication and lets the AI assistant access your calendar.",
            capabilities: [
                "Connect your Google Calendar.",
                "Retrieve upcoming calendar events.",
                "View meeting schedules.",
                "Manage calendar-related operations.",
                "Access Google Meet event links.",
            ],
        },
        {
            id: "meeting",
            icon: Video,
            title: "Meeting Management",
            description:
                "Create meetings, schedule events, and generate Google Meet links.",
            details:
                "Manage your meeting workflow using the AI assistant instead of manually switching between different applications.",
            capabilities: [
                "Schedule new meetings.",
                "Check available time slots.",
                "Generate Google Meet links.",
                "View meeting information.",
                "Manage meeting schedules.",
            ],
        },
        {
            id: "voice",
            icon: Mic,
            title: "Voice Interaction",
            description:
                "Communicate with MeetingPilot using voice-based AI interaction.",
            details:
                "Use voice interaction to communicate with your AI assistant and perform meeting-related tasks conversationally.",
            capabilities: [
                "Start voice conversations.",
                "Speak your meeting requests.",
                "Interact with the AI assistant.",
                "Receive AI-generated responses.",
            ],
        },
        {
            id: "agent",
            icon: Bot,
            title: "Autonomous AI Agent",
            description:
                "Use MCP-powered tools to perform meeting-related tasks intelligently.",
            details:
                "MeetingPilot uses Spring AI and Model Context Protocol (MCP) to connect the AI assistant with external tools, allowing it to perform supported meeting operations.",
            capabilities: [
                "Use MCP tools for meeting operations.",
                "Connect AI with Google Calendar.",
                "Execute supported tool calls.",
                "Process user requests autonomously.",
                "Generate contextual responses.",
            ],
        },
        {
            id: "security",
            icon: ShieldCheck,
            title: "Secure Integration",
            description:
                "Use Google OAuth authentication to connect calendar services securely.",
            details:
                "MeetingPilot uses Google OAuth to authorize access to calendar services rather than asking users to share their Google password.",
            capabilities: [
                "Google OAuth authentication.",
                "Authorized calendar access.",
                "Secure credential configuration.",
                "Controlled access to connected services.",
            ],
        },
    ];

    // Reusable Card
    const openDetails = (item) => {
        setSelectedFeature(item);
    };

    return (
        <div className="about-page">

            {/* Hero Section */}
            <section className="about-hero">
                <div className="about-logo">
                    <Bot size={42} />
                </div>

                <div className="about-hero-content">
          <span className="about-label">
            <Sparkles size={14} />
            YOUR AI MEETING ASSISTANT
          </span>

                    <h1>About MeetingPilot AI</h1>

                    <p>
                        MeetingPilot AI is an intelligent autonomous meeting assistant
                        designed to simplify meeting management. Schedule meetings,
                        manage your calendar, and interact with AI using natural language
                        or voice.
                    </p>
                </div>
            </section>

            {/* Application Information */}
            <section className="about-section">
                <div className="about-section-heading">
                    <h2>Application Information</h2>
                    <p>
                        Everything you need to know about MeetingPilot AI.
                        Click any card to explore more.
                    </p>
                </div>

                <div className="about-info-grid">
                    {infoCards.map((info) => {
                        const Icon = info.icon;

                        return (
                            <div
                                className="about-info-card"
                                key={info.id}
                                onClick={() => openDetails(info)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        openDetails(info);
                                    }
                                }}
                            >
                                <div className="about-feature-icon">
                                    <Icon size={22} />
                                </div>

                                <span>{info.title}</span>

                                <h3>{info.value}</h3>

                                <span className="about-learn-more">
                  Explore details →
                </span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Key Features */}
            <section className="about-section">
                <div className="about-section-heading">
                    <h2>Key Features</h2>
                    <p>
                        Powerful capabilities to make meeting management easier.
                        Click any feature to explore more.
                    </p>
                </div>

                <div className="about-features-grid">
                    {features.map((feature) => {
                        const Icon = feature.icon;

                        return (
                            <div
                                className="about-feature-card"
                                key={feature.id}
                                onClick={() => openDetails(feature)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        openDetails(feature);
                                    }
                                }}
                            >
                                <div className="about-feature-icon">
                                    <Icon size={22} />
                                </div>

                                <h3>{feature.title}</h3>

                                <p>{feature.description}</p>

                                <span className="about-learn-more">
                  Explore feature →
                </span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Reusable Details Modal */}
            {selectedFeature && (
                <div
                    className="feature-modal-overlay"
                    onClick={() => setSelectedFeature(null)}
                >
                    <div
                        className="feature-modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="feature-modal-title"
                    >
                        <button
                            className="feature-modal-close"
                            onClick={() => setSelectedFeature(null)}
                            aria-label="Close feature details"
                        >
                            <X size={21} />
                        </button>

                        <div className="feature-modal-icon">
                            {React.createElement(selectedFeature.icon, {
                                size: 30,
                            })}
                        </div>

                        <span className="feature-modal-label">
              MEETINGPILOT CAPABILITY
            </span>

                        <h2 id="feature-modal-title">
                            {selectedFeature.title}
                        </h2>

                        <p className="feature-modal-description">
                            {selectedFeature.details}
                        </p>

                        <div className="feature-modal-divider" />

                        <h3>What you can do</h3>

                        <div className="feature-capabilities">
                            {selectedFeature.capabilities.map(
                                (capability, index) => (
                                    <div
                                        className="feature-capability-item"
                                        key={index}
                                    >
                                        <CheckCircle2 size={18} />
                                        <span>{capability}</span>
                                    </div>
                                )
                            )}
                        </div>

                        <button
                            className="feature-modal-done"
                            onClick={() => setSelectedFeature(null)}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}



            {/* Footer */}
            <footer className="about-footer">
                <div className="about-footer-icon">
                    <Sparkles size={18} />
                </div>

                <h3>Meet smarter with MeetingPilot AI</h3>

                <p>
                    Your intelligent partner for effortless meeting management.
                </p>

                <span>© 2026 MeetingPilot AI. All rights reserved.</span>
            </footer>

        </div>
    );
};

export default About;
