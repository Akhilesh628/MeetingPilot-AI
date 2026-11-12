package com.meeting.mcp.tools;


import com.meeting.mcp.dto.MeetingRequest;
import com.meeting.mcp.dto.MeetingResponse;
import com.meeting.mcp.service.GoogleCalendarService;

import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import com.google.api.services.calendar.model.Event;
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
            int days) throws Exception {

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
            int durationMinutes) throws Exception {

        return calendarService.findAvailableSlots(
                date, timeZone, durationMinutes);
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
            String timeZone) throws Exception {

        return calendarService.checkAvailability(
                startDateTime, endDateTime, timeZone);
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
            String attendeeEmails) throws Exception {

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
            String timeZone) throws Exception {

        return calendarService.updateMeeting(
                eventId, newStart, newEnd, timeZone);
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
            String eventId) throws Exception {

        return calendarService.cancelMeeting(eventId);
    }



    @McpTool(
            name = "update_meeting",
            description = """
        Update an existing Google Calendar meeting.

        Can update meeting title, start time and end time.
        Only modify the fields requested by the user.
        Preserve attendees and Google Meet conference details.

        Date times must be RFC3339 timestamps with timezone offset.
        Example: 2026-11-12T16:00:00+05:30

        If only start time is changed, preserve existing duration.
        """
    )
    public String updateTheMeeting(
            @McpToolParam(description = "Google Calendar event ID")
            String eventId,

            @McpToolParam(
                    description = "New meeting title. Leave empty to preserve existing title",
                    required = false
            )
            String newTitle,

            @McpToolParam(
                    description = "New start datetime in RFC3339 format, or empty to preserve",
                    required = false
            )
            String newStartDateTime,

            @McpToolParam(
                    description = "New end datetime in RFC3339 format, or empty to preserve",
                    required = false
            )
            String newEndDateTime
    ) {

        try {
            Event updated = calendarService.updateTheMeeting(
                    eventId,
                    newTitle,
                    newStartDateTime,
                    newEndDateTime
            );

            return """
            Meeting updated successfully.

            Title: %s
            Event ID: %s
            """.formatted(
                    updated.getSummary(),
                    updated.getId()
            );

        } catch (Exception e) {
            return "Unable to update meeting: " + e.getMessage();
        }
    }

}
