package com.meeting.mcp.tools;

import com.meeting.mcp.dto.MeetingRequest;
import com.meeting.mcp.dto.MeetingResponse;
import com.meeting.mcp.service.GoogleCalendarService;

import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class CalendarMcpTools {

    private final GoogleCalendarService calendarService;

    public CalendarMcpTools(
            GoogleCalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @McpTool(
            name = "getUpcomingMeetings",
            description = "Retrieve upcoming Google Calendar meetings "
                    + "for the next specified number of days."
    )
    public String getUpcomingMeetings(
            @McpToolParam(
                    description = "Number of days to look ahead, maximum 90",
                    required = true)
            int days) {

        return calendarService.getUpcomingMeetings(days);
    }

    @McpTool(
            name = "findAvailableSlots",
            description = "Find available meeting slots between 9 AM "
                    + "and 6 PM for a given date and duration."
    )
    public String findAvailableSlots(
            @McpToolParam(
                    description = "Date in YYYY-MM-DD format",
                    required = true)
            String date,

            @McpToolParam(
                    description = "Timezone, e.g. Asia/Kolkata",
                    required = true)
            String timeZone,

            @McpToolParam(
                    description = "Meeting duration in minutes",
                    required = true)
            int durationMinutes) {

        return calendarService.findAvailableSlots(
                date,
                timeZone,
                durationMinutes
        );
    }

    @McpTool(
            name = "checkAvailability",
            description = "Check Google Calendar free/busy status "
                    + "for a given time range."
    )
    public String checkAvailability(
            @McpToolParam(
                    description = "Start date time in ISO-8601 format",
                    required = true)
            String startDateTime,

            @McpToolParam(
                    description = "End date time in ISO-8601 format",
                    required = true)
            String endDateTime,

            @McpToolParam(
                    description = "Timezone, for example Asia/Kolkata",
                    required = true)
            String timeZone) {

        return calendarService.checkAvailability(
                startDateTime,
                endDateTime,
                timeZone
        );
    }

    @McpTool(
            name = "createMeeting",
            description = "Create a Google Calendar meeting, "
                    + "invite attendees and request a Google Meet link. "
                    + "Check availability before booking."
    )
    public MeetingResponse createMeeting(
            @McpToolParam(
                    description = "Meeting title",
                    required = true)
            String title,

            @McpToolParam(
                    description = "Meeting description",
                    required = false)
            String description,

            @McpToolParam(
                    description = "Start date time in ISO-8601 format",
                    required = true)
            String startDateTime,

            @McpToolParam(
                    description = "End date time in ISO-8601 format",
                    required = true)
            String endDateTime,

            @McpToolParam(
                    description = "Timezone such as Asia/Kolkata",
                    required = true)
            String timeZone,

            @McpToolParam(
                    description = "Comma-separated attendee email addresses",
                    required = false)
            String attendeeEmails) {

        List<String> emails =
                attendeeEmails == null || attendeeEmails.isBlank()
                        ? List.of()
                        : Arrays.stream(attendeeEmails.split(","))
                        .map(String::trim)
                        .filter(email -> !email.isBlank())
                        .toList();

        return calendarService.createMeeting(
                new MeetingRequest(
                        title,
                        description,
                        startDateTime,
                        endDateTime,
                        timeZone,
                        emails
                )
        );
    }

    @McpTool(
            name = "updateMeeting",
            description = "Reschedule an existing Google Calendar meeting "
                    + "using its event ID."
    )
    public String updateMeeting(
            @McpToolParam(
                    description = "Google Calendar event ID",
                    required = true)
            String eventId,

            @McpToolParam(
                    description = "New start time in ISO-8601 format",
                    required = true)
            String newStart,

            @McpToolParam(
                    description = "New end time in ISO-8601 format",
                    required = true)
            String newEnd,

            @McpToolParam(
                    description = "Timezone",
                    required = true)
            String timeZone) {

        return calendarService.updateMeeting(
                eventId,
                newStart,
                newEnd,
                timeZone
        );
    }

    @McpTool(
            name = "cancelMeeting",
            description = "Cancel an existing Google Calendar meeting "
                    + "using its event ID."
    )
    public String cancelMeeting(
            @McpToolParam(
                    description = "Google Calendar event ID",
                    required = true)
            String eventId) {

        return calendarService.cancelMeeting(eventId);
    }
}