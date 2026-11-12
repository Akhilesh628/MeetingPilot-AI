package com.meeting.mcp.service;


import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.*;

import com.meeting.mcp.dto.MeetingRequest;
import com.meeting.mcp.dto.MeetingResponse;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GoogleCalendarService {

    private final Calendar calendar;

    public GoogleCalendarService(Calendar calendar) {
        this.calendar = calendar;
    }

    // 1. Check Google Calendar availability
    public String checkAvailability(
            String startDateTime,
            String endDateTime,
            String timeZone) throws Exception {

        FreeBusyRequest request = new FreeBusyRequest()
                .setTimeMin(new com.google.api.client.util.DateTime(
                        startDateTime))
                .setTimeMax(new com.google.api.client.util.DateTime(
                        endDateTime))
                .setTimeZone(timeZone)
                .setItems(List.of(
                        new FreeBusyRequestItem()
                                .setId("primary")
                ));

        FreeBusyResponse response =
                calendar.freebusy().query(request).execute();

        FreeBusyCalendar primary =
                response.getCalendars().get("primary");

        if (primary == null) {
            throw new IllegalStateException(
                    "Primary calendar was not returned");
        }

        List<TimePeriod> busy = primary.getBusy();

        if (busy == null || busy.isEmpty()) {
            return "AVAILABLE: No conflicting events found.";
        }

        StringBuilder result = new StringBuilder(
                "UNAVAILABLE: Conflicting events found:\n");

        for (TimePeriod period : busy) {
            result.append(period.getStart())
                    .append(" to ")
                    .append(period.getEnd())
                    .append("\n");
        }

        return result.toString();
    }

    // 2. Create meeting and Google Meet link
    public MeetingResponse createMeeting(
            MeetingRequest request) throws Exception {

        OffsetDateTime start =
                OffsetDateTime.parse(request.startDateTime());

        OffsetDateTime end =
                OffsetDateTime.parse(request.endDateTime());

        if (!end.isAfter(start)) {
            throw new IllegalArgumentException(
                    "Meeting end must be after start");
        }

        String availability = checkAvailability(
                request.startDateTime(),
                request.endDateTime(),
                request.timeZone()
        );

        if (availability.startsWith("UNAVAILABLE")) {
            throw new IllegalStateException(availability);
        }

        Event event = new Event()
                .setSummary(request.title())
                .setDescription(request.description())
                .setStart(
                        new EventDateTime()
                                .setDateTime(
                                        new com.google.api.client.util.DateTime(
                                                request.startDateTime()))
                                .setTimeZone(request.timeZone())
                )
                .setEnd(
                        new EventDateTime()
                                .setDateTime(
                                        new com.google.api.client.util.DateTime(
                                                request.endDateTime()))
                                .setTimeZone(request.timeZone())
                );

        // Add attendees
        if (request.attendeeEmails() != null) {

            List<EventAttendee> attendees = new ArrayList<>();

            for (String email : request.attendeeEmails()) {
                attendees.add(
                        new EventAttendee().setEmail(email.trim())
                );
            }

            event.setAttendees(attendees);
        }

        // Request Google Meet conference
        CreateConferenceRequest conferenceRequest =
                new CreateConferenceRequest()
                        .setRequestId(UUID.randomUUID().toString())
                        .setConferenceSolutionKey(
                                new ConferenceSolutionKey()
                                        .setType("hangoutsMeet")
                        );

        event.setConferenceData(
                new ConferenceData()
                        .setCreateRequest(conferenceRequest)
        );

        Event created = calendar.events()
                .insert("primary", event)
                .setConferenceDataVersion(1)
                .setSendUpdates("all")
                .execute();

        String meetLink = created.getHangoutLink();

        if (meetLink == null &&
                created.getConferenceData() != null &&
                created.getConferenceData().getEntryPoints() != null) {

            meetLink = created.getConferenceData()
                    .getEntryPoints()
                    .stream()
                    .filter(entry ->
                            "video".equals(entry.getEntryPointType()))
                    .map(EntryPoint::getUri)
                    .findFirst()
                    .orElse(null);
        }

        return new MeetingResponse(
                true,
                created.getId(),
                created.getSummary(),
                created.getStart().getDateTime().toString(),
                created.getEnd().getDateTime().toString(),
                meetLink,
                "Meeting created successfully"
        );
    }

    // 3. Reschedule existing meeting
    public String updateMeeting(
            String eventId,
            String newStart,
            String newEnd,
            String timeZone) throws Exception {

        OffsetDateTime start = OffsetDateTime.parse(newStart);
        OffsetDateTime end = OffsetDateTime.parse(newEnd);

        if (!end.isAfter(start)) {
            throw new IllegalArgumentException(
                    "End time must be after start time");
        }

        String availability = checkAvailability(
                newStart, newEnd, timeZone);

        if (availability.startsWith("UNAVAILABLE")) {
            return availability;
        }

        Event event = calendar.events()
                .get("primary", eventId)
                .execute();

        event.setStart(
                new EventDateTime()
                        .setDateTime(
                                new com.google.api.client.util.DateTime(newStart))
                        .setTimeZone(timeZone)
        );

        event.setEnd(
                new EventDateTime()
                        .setDateTime(
                                new com.google.api.client.util.DateTime(newEnd))
                        .setTimeZone(timeZone)
        );

        calendar.events()
                .patch("primary", eventId, event)
                .setSendUpdates("all")
                .execute();

        return "Meeting rescheduled successfully. Event ID: " + eventId;
    }

    // 4. Cancel meeting
    public String cancelMeeting(String eventId) throws Exception
    {

        calendar.events()
                .delete("primary", eventId)
                .setSendUpdates("all")
                .execute();

        return "Meeting cancelled successfully. Event ID: " + eventId;
    }


    public String getUpcomingMeetings(int days) throws Exception {

        if (days < 1 || days > 90) {
            throw new IllegalArgumentException(
                    "Days must be between 1 and 90");
        }

        Instant now = Instant.now();

        Instant end = now.plusSeconds(days * 24L * 60 * 60);

        Events events = calendar.events()
                .list("primary")
                .setTimeMin(new com.google.api.client.util.DateTime(
                        now.toEpochMilli()))
                .setTimeMax(new com.google.api.client.util.DateTime(
                        end.toEpochMilli()))
                .setMaxResults(50)
                .setSingleEvents(true)
                .setOrderBy("startTime")
                .execute();

        if (events.getItems() == null ||
                events.getItems().isEmpty()) {
            return "No upcoming meetings found.";
        }

        return events.getItems().stream()
                .map(event -> {
                    String start = event.getStart().getDateTime() != null
                            ? event.getStart().getDateTime().toString()
                            : event.getStart().getDate().toString();

                    return """
                        Meeting: %s
                        Event ID: %s
                        Start: %s
                        Meet Link: %s
                        """.formatted(
                            event.getSummary(),
                            event.getId(),
                            start,
                            event.getHangoutLink() == null
                                    ? "Not available"
                                    : event.getHangoutLink()
                    );
                })
                .collect(Collectors.joining("\n"));
    }

    public String findAvailableSlots(
            String date,
            String timeZone,
            int durationMinutes) throws Exception {

        if (durationMinutes < 15 || durationMinutes > 480) {
            throw new IllegalArgumentException(
                    "Duration must be between 15 and 480 minutes");
        }

        ZoneId zone = ZoneId.of(timeZone);

        java.time.LocalDate localDate =
                java.time.LocalDate.parse(date);

        ZonedDateTime dayStart =
                localDate.atTime(9, 0).atZone(zone);

        ZonedDateTime dayEnd =
                localDate.atTime(18, 0).atZone(zone);

        FreeBusyRequest request = new FreeBusyRequest()
                .setTimeMin(new com.google.api.client.util.DateTime(
                        dayStart.toInstant().toEpochMilli()))
                .setTimeMax(new com.google.api.client.util.DateTime(
                        dayEnd.toInstant().toEpochMilli()))
                .setTimeZone(timeZone)
                .setItems(List.of(
                        new FreeBusyRequestItem().setId("primary")
                ));

        FreeBusyResponse response =
                calendar.freebusy().query(request).execute();

        FreeBusyCalendar primary =
                response.getCalendars().get("primary");

        List<TimePeriod> busy =
                primary == null || primary.getBusy() == null
                        ? List.of()
                        : primary.getBusy();

        List<String> available = new java.util.ArrayList<>();

        ZonedDateTime candidate = dayStart;

        while (!candidate.plusMinutes(durationMinutes)
                .isAfter(dayEnd)) {

            ZonedDateTime candidateEnd =
                    candidate.plusMinutes(durationMinutes);

            Instant start = candidate.toInstant();
            Instant finish = candidateEnd.toInstant();


            boolean conflict = busy.stream().anyMatch(period -> {

                Instant busyStart = Instant.ofEpochMilli(
                        period.getStart().getValue()
                );

                Instant busyEnd = Instant.ofEpochMilli(
                        period.getEnd().getValue()
                );

                return start.isBefore(busyEnd)
                        && finish.isAfter(busyStart);
            });


            if (!conflict && !start.isBefore(Instant.now())) {
                available.add(
                        candidate.toString() + " to "
                                + candidateEnd.toString()
                );
            }

            candidate = candidate.plusMinutes(30);
        }

        if (available.isEmpty()) {
            return "No available slots found for " + date;
        }

        return String.join("\n", available);
    }



    public Event updateTheMeeting(
            String eventId,
            String newTitle,
            String newStartDateTime,
            String newEndDateTime
    ) throws IOException {

        if (eventId == null || eventId.isBlank()) {
            throw new IllegalArgumentException("Event ID is required");
        }

        if ((newTitle == null || newTitle.isBlank())
                && (newStartDateTime == null || newStartDateTime.isBlank())
                && (newEndDateTime == null || newEndDateTime.isBlank())) {
            throw new IllegalArgumentException(
                    "At least one field must be provided"
            );
        }

        // Retrieve existing event
        Event existing = calendar.events()
                .get("primary", eventId)
                .execute();

        Event patch = new Event();

        // Update meeting title
        if (newTitle != null && !newTitle.isBlank()) {
            patch.setSummary(newTitle);
        }

        // Update start time
        if (newStartDateTime != null && !newStartDateTime.isBlank()) {

            DateTime newStart = new DateTime(newStartDateTime);

            patch.setStart(
                    new EventDateTime()
                            .setDateTime(newStart)
                            .setTimeZone("Asia/Kolkata")
            );

            // Preserve existing duration if end time isn't supplied
            if (newEndDateTime == null || newEndDateTime.isBlank()) {

                DateTime oldStart = existing.getStart().getDateTime();
                DateTime oldEnd = existing.getEnd().getDateTime();

                if (oldStart == null || oldEnd == null) {
                    throw new IllegalArgumentException(
                            "Cannot automatically preserve duration for an all-day event"
                    );
                }

                long duration = oldEnd.getValue() - oldStart.getValue();

                DateTime calculatedEnd =
                        new DateTime(newStart.getValue() + duration);

                patch.setEnd(
                        new EventDateTime()
                                .setDateTime(calculatedEnd)
                                .setTimeZone("Asia/Kolkata")
                );
            }
        }

        // Update end time
        if (newEndDateTime != null && !newEndDateTime.isBlank()) {

            DateTime newEnd = new DateTime(newEndDateTime);

            patch.setEnd(
                    new EventDateTime()
                            .setDateTime(newEnd)
                            .setTimeZone("Asia/Kolkata")
            );
        }

        // Validate final event time
        DateTime finalStart =
                patch.getStart() != null
                        ? patch.getStart().getDateTime()
                        : existing.getStart().getDateTime();

        DateTime finalEnd =
                patch.getEnd() != null
                        ? patch.getEnd().getDateTime()
                        : existing.getEnd().getDateTime();

        if (finalStart != null && finalEnd != null
                && finalEnd.getValue() <= finalStart.getValue()) {
            throw new IllegalArgumentException(
                    "Meeting end time must be after start time"
            );
        }

        // PATCH only specified fields; preserve other event fields
        return calendar.events()
                .patch("primary", eventId, patch)
                .setConferenceDataVersion(1)
                .execute();
    }



}
