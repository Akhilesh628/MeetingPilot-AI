package com.meeting.mcp.service;

import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.*;

import com.meeting.mcp.dto.MeetingRequest;
import com.meeting.mcp.dto.MeetingResponse;
import com.meeting.mcp.exception.CalendarOperationException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GoogleCalendarService {

    private static final String PRIMARY_CALENDAR = "primary";

    private final Calendar calendar;

    public GoogleCalendarService(Calendar calendar) {
        this.calendar = calendar;
    }

    // =========================================================
    // CENTRALIZED EXCEPTION HANDLING
    // =========================================================

    @FunctionalInterface
    private interface CalendarCall<T> {
        T execute() throws IOException;
    }

    private <T> T executeCalendarCall(
            String operation,
            CalendarCall<T> action) {

        try {
            return action.execute();

        } catch (GoogleJsonResponseException ex) {

            int googleStatus = ex.getStatusCode();

            HttpStatus status = mapGoogleStatus(googleStatus);

            String errorCode = switch (googleStatus) {
                case 400 -> "GOOGLE_INVALID_REQUEST";
                case 401 -> "GOOGLE_AUTHENTICATION_FAILED";
                case 403 -> "GOOGLE_PERMISSION_DENIED";
                case 404 -> "CALENDAR_RESOURCE_NOT_FOUND";
                case 409 -> "CALENDAR_CONFLICT";
                case 429 -> "GOOGLE_CALENDAR_RATE_LIMIT";
                default -> "GOOGLE_CALENDAR_API_ERROR";
            };

            throw new CalendarOperationException(
                    operation + " failed. Google Calendar returned HTTP "
                            + googleStatus + ".",
                    errorCode,
                    status,
                    ex
            );

        } catch (IOException ex) {

            throw new CalendarOperationException(
                    operation
                            + " failed because Google Calendar "
                            + "could not be reached.",
                    "GOOGLE_CALENDAR_UNAVAILABLE",
                    HttpStatus.BAD_GATEWAY,
                    ex
            );
        }
    }

    private HttpStatus mapGoogleStatus(int code) {

        return switch (code) {
            case 400 -> HttpStatus.BAD_REQUEST;
            case 401 -> HttpStatus.UNAUTHORIZED;
            case 403 -> HttpStatus.FORBIDDEN;
            case 404 -> HttpStatus.NOT_FOUND;
            case 409 -> HttpStatus.CONFLICT;
            case 429 -> HttpStatus.TOO_MANY_REQUESTS;
            default -> HttpStatus.BAD_GATEWAY;
        };
    }

    // =========================================================
    // VALIDATION METHODS
    // =========================================================

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private ZoneId validateTimeZone(String timeZone) {

        if (isBlank(timeZone)) {
            throw new IllegalArgumentException(
                    "Timezone is required."
            );
        }

        try {
            return ZoneId.of(timeZone);

        } catch (Exception ex) {
            throw new IllegalArgumentException(
                    "Invalid timezone: " + timeZone
            );
        }
    }

    private OffsetDateTime parseDateTime(
            String value,
            String fieldName) {

        if (isBlank(value)) {
            throw new IllegalArgumentException(
                    fieldName + " is required."
            );
        }

        try {
            return OffsetDateTime.parse(value);

        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(
                    fieldName
                            + " must be ISO-8601 date-time with offset. "
                            + "Example: 2026-11-14T10:00:00+05:30"
            );
        }
    }

    private void validateEventRange(
            String startDateTime,
            String endDateTime,
            String timeZone) {

        OffsetDateTime start =
                parseDateTime(startDateTime, "Start date-time");

        OffsetDateTime end =
                parseDateTime(endDateTime, "End date-time");

        if (!end.isAfter(start)) {
            throw new IllegalArgumentException(
                    "Meeting end time must be after start time."
            );
        }

        validateTimeZone(timeZone);
    }

    private void validateEventId(String eventId) {

        if (isBlank(eventId)) {
            throw new IllegalArgumentException(
                    "Google Calendar event ID is required."
            );
        }
    }

    private void validateMeetingRequest(MeetingRequest request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Meeting request is required."
            );
        }

        if (isBlank(request.title())) {
            throw new IllegalArgumentException(
                    "Meeting title is required."
            );
        }

        validateEventRange(
                request.startDateTime(),
                request.endDateTime(),
                request.timeZone()
        );

        validateAttendees(request.attendeeEmails());
    }

    private void validateAttendees(List<String> emails) {

        if (emails == null) {
            return;
        }

        for (String email : emails) {

            if (isBlank(email)
                    || !email.trim().matches(
                    "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {

                throw new IllegalArgumentException(
                        "Invalid attendee email: " + email
                );
            }
        }
    }

    // =========================================================
    // FREE BUSY RESPONSE VALIDATION
    // =========================================================

    private FreeBusyCalendar getPrimaryCalendar(
            FreeBusyResponse response) {

        if (response == null || response.getCalendars() == null) {
            throw new CalendarOperationException(
                    "Google Calendar returned an empty availability response.",
                    "CALENDAR_RESPONSE_EMPTY",
                    HttpStatus.BAD_GATEWAY
            );
        }

        FreeBusyCalendar primary =
                response.getCalendars().get(PRIMARY_CALENDAR);

        if (primary == null) {
            throw new CalendarOperationException(
                    "Primary calendar was not returned.",
                    "PRIMARY_CALENDAR_MISSING",
                    HttpStatus.BAD_GATEWAY
            );
        }

        return primary;
    }

    private List<TimePeriod> getBusyPeriods(
            FreeBusyResponse response) {

        FreeBusyCalendar primary =
                getPrimaryCalendar(response);

        return primary.getBusy() == null
                ? List.of()
                : primary.getBusy();
    }

    // =========================================================
    // 1. CHECK CALENDAR AVAILABILITY
    // =========================================================

    public String checkAvailability(
            String startDateTime,
            String endDateTime,
            String timeZone) {

        validateEventRange(
                startDateTime,
                endDateTime,
                timeZone
        );

        FreeBusyRequest request = new FreeBusyRequest()
                .setTimeMin(new DateTime(startDateTime))
                .setTimeMax(new DateTime(endDateTime))
                .setTimeZone(timeZone)
                .setItems(List.of(
                        new FreeBusyRequestItem()
                                .setId(PRIMARY_CALENDAR)
                ));

        FreeBusyResponse response = executeCalendarCall(
                "Checking calendar availability",
                () -> calendar.freebusy()
                        .query(request)
                        .execute()
        );

        List<TimePeriod> busyPeriods =
                getBusyPeriods(response);

        if (busyPeriods.isEmpty()) {
            return "AVAILABLE: No conflicting events found.";
        }

        StringBuilder result = new StringBuilder(
                "UNAVAILABLE: Conflicting events found:\n"
        );

        for (TimePeriod period : busyPeriods) {
            result.append(period.getStart())
                    .append(" to ")
                    .append(period.getEnd())
                    .append("\n");
        }

        return result.toString();
    }

    // =========================================================
    // 2. CREATE MEETING AND GOOGLE MEET LINK
    // =========================================================

    public MeetingResponse createMeeting(
            MeetingRequest request) {

        validateMeetingRequest(request);

        String availability = checkAvailability(
                request.startDateTime(),
                request.endDateTime(),
                request.timeZone()
        );

        if (availability.startsWith("UNAVAILABLE")) {
            throw new CalendarOperationException(
                    availability,
                    "MEETING_TIME_CONFLICT",
                    HttpStatus.CONFLICT
            );
        }

        Event event = new Event()
                .setSummary(request.title().trim())
                .setDescription(request.description())
                .setStart(
                        new EventDateTime()
                                .setDateTime(
                                        new DateTime(
                                                request.startDateTime()
                                        )
                                )
                                .setTimeZone(request.timeZone())
                )
                .setEnd(
                        new EventDateTime()
                                .setDateTime(
                                        new DateTime(
                                                request.endDateTime()
                                        )
                                )
                                .setTimeZone(request.timeZone())
                );

        // Add meeting attendees
        if (request.attendeeEmails() != null
                && !request.attendeeEmails().isEmpty()) {

            List<EventAttendee> attendees =
                    new ArrayList<>();

            for (String email : request.attendeeEmails()) {
                attendees.add(
                        new EventAttendee()
                                .setEmail(email.trim())
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

        Event created = executeCalendarCall(
                "Creating meeting",
                () -> calendar.events()
                        .insert(PRIMARY_CALENDAR, event)
                        .setConferenceDataVersion(1)
                        .setSendUpdates("all")
                        .execute()
        );

        if (created == null || isBlank(created.getId())) {
            throw new CalendarOperationException(
                    "Google Calendar did not return a valid created event.",
                    "MEETING_CREATE_RESPONSE_INVALID",
                    HttpStatus.BAD_GATEWAY
            );
        }

        String meetLink = created.getHangoutLink();

        if (isBlank(meetLink)
                && created.getConferenceData() != null
                && created.getConferenceData().getEntryPoints() != null) {

            meetLink = created.getConferenceData()
                    .getEntryPoints()
                    .stream()
                    .filter(entry ->
                            "video".equals(entry.getEntryPointType()))
                    .map(EntryPoint::getUri)
                    .filter(uri -> !isBlank(uri))
                    .findFirst()
                    .orElse(null);
        }

        String start = created.getStart() != null
                && created.getStart().getDateTime() != null
                ? created.getStart().getDateTime().toString()
                : request.startDateTime();

        String end = created.getEnd() != null
                && created.getEnd().getDateTime() != null
                ? created.getEnd().getDateTime().toString()
                : request.endDateTime();

        return new MeetingResponse(
                true,
                created.getId(),
                created.getSummary(),
                start,
                end,
                meetLink,
                "Meeting created successfully."
        );
    }

    // =========================================================
    // 3. UPDATE / RESCHEDULE EXISTING MEETING
    // =========================================================

    public String updateMeeting(
            String eventId,
            String newStart,
            String newEnd,
            String timeZone) {

        validateEventId(eventId);

        validateEventRange(
                newStart,
                newEnd,
                timeZone
        );

        Instant requestedStart =
                OffsetDateTime.parse(newStart).toInstant();

        Instant requestedEnd =
                OffsetDateTime.parse(newEnd).toInstant();

        // Load existing event
        Event existingEvent = executeCalendarCall(
                "Loading meeting before rescheduling",
                () -> calendar.events()
                        .get(PRIMARY_CALENDAR, eventId)
                        .execute()
        );

        // Fetch overlapping events.
        // Google FreeBusy does not return event IDs, so use events.list().
        Events overlappingEvents = executeCalendarCall(
                "Checking availability for rescheduling",
                () -> calendar.events()
                        .list(PRIMARY_CALENDAR)
                        .setTimeMin(new DateTime(newStart))
                        .setTimeMax(new DateTime(newEnd))
                        .setSingleEvents(true)
                        .setShowDeleted(false)
                        .setMaxResults(2500)
                        .execute()
        );

        // Exclude the event currently being rescheduled.
        boolean conflict =
                overlappingEvents.getItems() != null
                        && overlappingEvents.getItems().stream()
                        .filter(event ->
                                !eventId.equals(event.getId()))
                        .anyMatch(event ->
                                overlapsRequestedTime(
                                        event,
                                        requestedStart,
                                        requestedEnd,
                                        timeZone
                                )
                        );

        if (conflict) {
            throw new CalendarOperationException(
                    "The requested time slot is unavailable.",
                    "MEETING_TIME_CONFLICT",
                    HttpStatus.CONFLICT
            );
        }

        // Update existing event start time
        existingEvent.setStart(
                new EventDateTime()
                        .setDateTime(new DateTime(newStart))
                        .setTimeZone(timeZone)
        );

        // Update existing event end time
        existingEvent.setEnd(
                new EventDateTime()
                        .setDateTime(new DateTime(newEnd))
                        .setTimeZone(timeZone)
        );

        executeCalendarCall(
                "Rescheduling meeting",
                () -> calendar.events()
                        .patch(
                                PRIMARY_CALENDAR,
                                eventId,
                                existingEvent
                        )
                        .setSendUpdates("all")
                        .execute()
        );

        return "Meeting rescheduled successfully. Event ID: "
                + eventId;
    }

    // =========================================================
    // CHECK TIMED AND ALL-DAY EVENT OVERLAP
    // =========================================================

    private boolean overlapsRequestedTime(
            Event event,
            Instant requestedStart,
            Instant requestedEnd,
            String timeZone) {

        EventDateTime eventStart = event.getStart();
        EventDateTime eventEnd = event.getEnd();

        if (eventStart == null || eventEnd == null) {
            return false;
        }

        Instant existingStart;
        Instant existingEnd;

        // Timed event
        if (eventStart.getDateTime() != null
                && eventEnd.getDateTime() != null) {

            existingStart = Instant.ofEpochMilli(
                    eventStart.getDateTime().getValue()
            );

            existingEnd = Instant.ofEpochMilli(
                    eventEnd.getDateTime().getValue()
            );

        }
        // All-day event
        else if (eventStart.getDate() != null
                && eventEnd.getDate() != null) {

            ZoneId zone = validateTimeZone(timeZone);

            LocalDate startDate =
                    LocalDate.parse(eventStart.getDate().toString());

            LocalDate endDate =
                    LocalDate.parse(eventEnd.getDate().toString());

            existingStart = startDate
                    .atStartOfDay(zone)
                    .toInstant();

            // Google Calendar all-day event end date is exclusive.
            existingEnd = endDate
                    .atStartOfDay(zone)
                    .toInstant();

        } else {
            return false;
        }

        return requestedStart.isBefore(existingEnd)
                && requestedEnd.isAfter(existingStart);
    }

    // =========================================================
    // 4. CANCEL MEETING
    // =========================================================

    public String cancelMeeting(String eventId) {

        validateEventId(eventId);

        executeCalendarCall(
                "Cancelling meeting",
                () -> {
                    calendar.events()
                            .delete(PRIMARY_CALENDAR, eventId)
                            .setSendUpdates("all")
                            .execute();

                    return Boolean.TRUE;
                }
        );

        return "Meeting cancelled successfully. Event ID: "
                + eventId;
    }

    // =========================================================
    // 5. GET UPCOMING MEETINGS
    // =========================================================

    public String getUpcomingMeetings(int days) {

        if (days < 1 || days > 90) {
            throw new IllegalArgumentException(
                    "Days must be between 1 and 90."
            );
        }

        Instant now = Instant.now();

        Instant end = now.plusSeconds(
                days * 24L * 60L * 60L
        );

        Events events = executeCalendarCall(
                "Retrieving upcoming meetings",
                () -> calendar.events()
                        .list(PRIMARY_CALENDAR)
                        .setTimeMin(
                                new DateTime(now.toEpochMilli())
                        )
                        .setTimeMax(
                                new DateTime(end.toEpochMilli())
                        )
                        .setMaxResults(50)
                        .setSingleEvents(true)
                        .setOrderBy("startTime")
                        .execute()
        );

        if (events == null
                || events.getItems() == null
                || events.getItems().isEmpty()) {

            return "No upcoming meetings found.";
        }

        return events.getItems()
                .stream()
                .map(event -> {

                    String start = "Not available";

                    if (event.getStart() != null) {

                        if (event.getStart().getDateTime() != null) {
                            start = event.getStart()
                                    .getDateTime()
                                    .toString();

                        } else if (event.getStart().getDate() != null) {
                            start = event.getStart()
                                    .getDate()
                                    .toString();
                        }
                    }

                    return """
                            Meeting: %s
                            Event ID: %s
                            Start: %s
                            Meet Link: %s
                            """.formatted(
                            event.getSummary() == null
                                    ? "(No title)"
                                    : event.getSummary(),
                            event.getId(),
                            start,
                            event.getHangoutLink() == null
                                    ? "Not available"
                                    : event.getHangoutLink()
                    );
                })
                .collect(Collectors.joining("\n"));
    }

    // =========================================================
    // 6. FIND AVAILABLE MEETING SLOTS
    // =========================================================

    public String findAvailableSlots(
            String date,
            String timeZone,
            int durationMinutes) {

        if (isBlank(date)) {
            throw new IllegalArgumentException(
                    "Date is required in YYYY-MM-DD format."
            );
        }

        if (durationMinutes < 15 || durationMinutes > 480) {
            throw new IllegalArgumentException(
                    "Duration must be between 15 and 480 minutes."
            );
        }

        ZoneId zone = validateTimeZone(timeZone);

        LocalDate localDate;

        try {
            localDate = LocalDate.parse(date);

        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(
                    "Date must be in YYYY-MM-DD format."
            );
        }

        ZonedDateTime dayStart =
                localDate.atTime(9, 0).atZone(zone);

        ZonedDateTime dayEnd =
                localDate.atTime(18, 0).atZone(zone);

        FreeBusyRequest request = new FreeBusyRequest()
                .setTimeMin(
                        new DateTime(
                                dayStart.toInstant().toEpochMilli()
                        )
                )
                .setTimeMax(
                        new DateTime(
                                dayEnd.toInstant().toEpochMilli()
                        )
                )
                .setTimeZone(timeZone)
                .setItems(List.of(
                        new FreeBusyRequestItem()
                                .setId(PRIMARY_CALENDAR)
                ));

        FreeBusyResponse response = executeCalendarCall(
                "Finding available meeting slots",
                () -> calendar.freebusy()
                        .query(request)
                        .execute()
        );

        List<TimePeriod> busyPeriods =
                getBusyPeriods(response);

        List<String> availableSlots =
                new ArrayList<>();

        ZonedDateTime candidate = dayStart;

        while (!candidate.plusMinutes(durationMinutes)
                .isAfter(dayEnd)) {

            ZonedDateTime candidateEnd =
                    candidate.plusMinutes(durationMinutes);

            Instant slotStart = candidate.toInstant();
            Instant slotEnd = candidateEnd.toInstant();

            boolean conflict = busyPeriods.stream()
                    .anyMatch(period -> {

                        if (period.getStart() == null
                                || period.getEnd() == null) {
                            return false;
                        }

                        Instant busyStart = Instant.ofEpochMilli(
                                period.getStart().getValue()
                        );

                        Instant busyEnd = Instant.ofEpochMilli(
                                period.getEnd().getValue()
                        );

                        return slotStart.isBefore(busyEnd)
                                && slotEnd.isAfter(busyStart);
                    });

            if (!conflict
                    && !slotStart.isBefore(Instant.now())) {

                availableSlots.add(
                        candidate + " to " + candidateEnd
                );
            }

            candidate = candidate.plusMinutes(30);
        }

        if (availableSlots.isEmpty()) {
            return "No available slots found for " + date;
        }

        return String.join("\n", availableSlots);
    }
}
