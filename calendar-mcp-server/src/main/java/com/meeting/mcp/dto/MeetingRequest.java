package com.meeting.mcp.dto;

import java.util.List;

public record MeetingRequest(
        String title,
        String description,
        String startDateTime,
        String endDateTime,
        String timeZone,
        List<String> attendeeEmails
) {
}
