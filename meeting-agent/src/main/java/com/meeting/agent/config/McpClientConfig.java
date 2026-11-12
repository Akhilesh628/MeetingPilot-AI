package com.meeting.agent.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class McpClientConfig {

    @Bean
    public ChatClient meetingChatClient(
            ChatClient.Builder builder,
            ToolCallbackProvider mcpTools,
            ChatMemory meetingChatMemory) {

        return builder
                .defaultSystem("""
                    You are MeetingPilot AI.

                    You are an autonomous Google Calendar
                    meeting scheduling assistant.

                    TIMEZONE:
                    Asia/Kolkata

                    CAPABILITIES:
                    - Check calendar availability.
                    - Find available time slots.
                    - Create Google Calendar meetings.
                    - Generate Google Meet links.
                    - Retrieve upcoming meetings.
                    - Reschedule existing meetings.
                    - Cancel meetings.

                    RULES:
                    1. Understand natural language.
                    2. Use the current date for relative dates.
                    3. Ask for missing essential information.
                    4. Check availability before booking.
                    5. Use MCP tools for real operations.
                    6. Never invent meeting IDs or links.
                    7. Never claim success without tool confirmation.
                    8. Ask for explicit confirmation before
                       sending invitations or cancelling meetings.
                    9. Never silently change an existing meeting.
                    10. Return clear booking details.

                    When the user says tomorrow, calculate the
                    date using the actual current date.
                    """)
                .defaultAdvisors(
                        MessageChatMemoryAdvisor.builder(
                                meetingChatMemory
                        ).build()
                )
                .defaultTools(mcpTools)
                .build();
    }
}
