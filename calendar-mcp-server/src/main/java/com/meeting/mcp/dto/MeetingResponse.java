package com.meeting.mcp.dto;

public record MeetingResponse(
        boolean success,
        String eventId,
        String title,
        String startDateTime,
        String endDateTime,
        String meetLink,
        String message
) {
}
