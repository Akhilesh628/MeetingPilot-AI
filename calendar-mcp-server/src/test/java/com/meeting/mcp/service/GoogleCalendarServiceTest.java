package com.meeting.mcp.service;

import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.FreeBusyCalendar;
import com.google.api.services.calendar.model.FreeBusyResponse;
import com.google.api.services.calendar.model.TimePeriod;
import com.meeting.mcp.dto.MeetingRequest;
import com.meeting.mcp.dto.MeetingResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GoogleCalendarServiceTest {

    private static final String ZONE = "Asia/Kolkata";

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private Calendar calendar;

    @Mock
    private Calendar.Events.Delete deleteRequest;

    private GoogleCalendarService service;

    @BeforeEach
    void setUp() {
        service = new GoogleCalendarService(calendar);
    }

    @Test
    void checkAvailabilityReportsWhenThereAreNoConflicts() throws Exception {
        when(calendar.freebusy().query(any()).execute())
                .thenReturn(freeBusyResponse());

        String result = service.checkAvailability(
                "2027-01-10T10:00:00+05:30",
                "2027-01-10T10:30:00+05:30",
                ZONE);

        assertEquals("AVAILABLE: No conflicting events found.", result);
    }

    @Test
    void checkAvailabilityIncludesBusyPeriods() throws Exception {
        TimePeriod busy = new TimePeriod()
                .setStart(new com.google.api.client.util.DateTime("2027-01-10T10:00:00+05:30"))
                .setEnd(new com.google.api.client.util.DateTime("2027-01-10T10:30:00+05:30"));
        when(calendar.freebusy().query(any()).execute())
                .thenReturn(freeBusyResponse(busy));

        String result = service.checkAvailability(
                "2027-01-10T10:00:00+05:30",
                "2027-01-10T10:30:00+05:30",
                ZONE);

        assertTrue(result.startsWith("UNAVAILABLE: Conflicting events found:"));
        assertTrue(result.contains(busy.getStart().toString()));
        assertTrue(result.contains(busy.getEnd().toString()));
    }

    @Test
    void createMeetingCreatesEventWithAttendeesAndReturnsMeetLink() throws Exception {
        when(calendar.freebusy().query(any()).execute())
                .thenReturn(freeBusyResponse());
        Event created = new Event()
                .setId("event-123")
                .setSummary("Planning")
                .setStart(dateTime("2027-01-10T10:00:00+05:30"))
                .setEnd(dateTime("2027-01-10T10:30:00+05:30"))
                .setHangoutLink("https://meet.google.com/abc-defg-hij");
        when(calendar.events()
                .insert(eq("primary"), any(Event.class))
                .setConferenceDataVersion(1)
                .setSendUpdates("all")
                .execute())
                .thenReturn(created);

        MeetingResponse response = service.createMeeting(new MeetingRequest(
                "Planning",
                "Weekly planning",
                "2027-01-10T10:00:00+05:30",
                "2027-01-10T10:30:00+05:30",
                ZONE,
                List.of(" person@example.com ")
        ));

        assertTrue(response.success());
        assertEquals("event-123", response.eventId());
        assertEquals("Planning", response.title());
        assertEquals("https://meet.google.com/abc-defg-hij", response.meetLink());

        ArgumentCaptor<Event> eventCaptor = ArgumentCaptor.forClass(Event.class);
        verify(calendar.events()).insert(eq("primary"), eventCaptor.capture());
        Event inserted = eventCaptor.getValue();
        assertEquals("Planning", inserted.getSummary());
        assertEquals("Weekly planning", inserted.getDescription());
        assertEquals(1, inserted.getAttendees().size());
        assertEquals("person@example.com", inserted.getAttendees().getFirst().getEmail());
        assertEquals("hangoutsMeet", inserted.getConferenceData()
                .getCreateRequest().getConferenceSolutionKey().getType());
    }

    @Test
    void createMeetingRejectsNonPositiveDurationBeforeCallingCalendar() {
        MeetingRequest request = new MeetingRequest(
                "Planning",
                null,
                "2027-01-10T10:30:00+05:30",
                "2027-01-10T10:00:00+05:30",
                ZONE,
                null
        );

        assertThrows(IllegalArgumentException.class, () -> service.createMeeting(request));

        verify(calendar, never()).freebusy();
    }

    @Test
    void updateMeetingReturnsConflictWithoutUpdatingEvent() throws Exception {
        TimePeriod busy = new TimePeriod()
                .setStart(new com.google.api.client.util.DateTime("2027-01-10T10:00:00+05:30"))
                .setEnd(new com.google.api.client.util.DateTime("2027-01-10T10:30:00+05:30"));
        when(calendar.freebusy().query(any()).execute())
                .thenReturn(freeBusyResponse(busy));

        String result = service.updateMeeting(
                "event-123",
                "2027-01-10T10:00:00+05:30",
                "2027-01-10T10:30:00+05:30",
                ZONE);

        assertTrue(result.startsWith("UNAVAILABLE:"));
        verify(calendar.events(), never()).get(any(), any());
        verify(calendar.events(), never()).patch(any(), any(), any(Event.class));
    }

    @Test
    void updateMeetingPatchesTheExistingEventWhenTheTimeIsAvailable() throws Exception {
        when(calendar.freebusy().query(any()).execute())
                .thenReturn(freeBusyResponse());
        Event existing = new Event().setId("event-123");
        when(calendar.events().get("primary", "event-123").execute())
                .thenReturn(existing);
        when(calendar.events()
                .patch(eq("primary"), eq("event-123"), any(Event.class))
                .setSendUpdates("all")
                .execute())
                .thenReturn(existing);

        String result = service.updateMeeting(
                "event-123",
                "2027-01-10T11:00:00+05:30",
                "2027-01-10T11:30:00+05:30",
                ZONE);

        assertEquals("Meeting rescheduled successfully. Event ID: event-123", result);
        ArgumentCaptor<Event> eventCaptor = ArgumentCaptor.forClass(Event.class);
        verify(calendar.events()).patch(eq("primary"), eq("event-123"), eventCaptor.capture());
        assertEquals("2027-01-10T11:00:00.000+05:30",
                eventCaptor.getValue().getStart().getDateTime().toStringRfc3339());
    }

    @Test
    void cancelMeetingDeletesTheEventAndReturnsConfirmation() throws Exception {
        when(calendar.events().delete("primary", "event-123"))
                .thenReturn(deleteRequest);
        when(deleteRequest.setSendUpdates("all")).thenReturn(deleteRequest);

        String result = service.cancelMeeting("event-123");

        assertEquals("Meeting cancelled successfully. Event ID: event-123", result);
        verify(deleteRequest).setSendUpdates("all");
        verify(deleteRequest).execute();
    }

    @Test
    void getUpcomingMeetingsRejectsDaysOutsideTheSupportedRange() {
        assertThrows(IllegalArgumentException.class, () -> service.getUpcomingMeetings(0));
        assertThrows(IllegalArgumentException.class, () -> service.getUpcomingMeetings(91));
    }

    @Test
    void getUpcomingMeetingsReportsWhenTheCalendarIsEmpty() throws Exception {
        when(calendar.events()
                .list("primary")
                .setTimeMin(any())
                .setTimeMax(any())
                .setMaxResults(50)
                .setSingleEvents(true)
                .setOrderBy("startTime")
                .execute())
                .thenReturn(new com.google.api.services.calendar.model.Events()
                        .setItems(List.of()));

        assertEquals("No upcoming meetings found.", service.getUpcomingMeetings(7));
    }

    @Test
    void findAvailableSlotsRejectsDurationOutsideTheSupportedRange() {
        assertThrows(IllegalArgumentException.class,
                () -> service.findAvailableSlots("2027-01-10", ZONE, 14));
        assertThrows(IllegalArgumentException.class,
                () -> service.findAvailableSlots("2027-01-10", ZONE, 481));
    }

    @Test
    void findAvailableSlotsReturnsWorkdaySlotsWhenCalendarIsFree() throws Exception {
        when(calendar.freebusy().query(any()).execute())
                .thenReturn(freeBusyResponse());
        String date = LocalDate.now(ZoneId.of(ZONE)).plusDays(2).toString();

        String result = service.findAvailableSlots(date, ZONE, 30);

        assertTrue(result.contains("09:00+05:30"));
        assertTrue(result.contains("09:30+05:30"));
    }

    @Test
    void updateTheMeetingPreservesDurationWhenOnlyStartChanges() throws Exception {
        Event existing = new Event()
                .setId("event-123")
                .setStart(dateTime("2027-01-10T10:00:00+05:30"))
                .setEnd(dateTime("2027-01-10T10:30:00+05:30"));
        when(calendar.events().get("primary", "event-123").execute())
                .thenReturn(existing);
        when(calendar.events()
                .patch(eq("primary"), eq("event-123"), any(Event.class))
                .setConferenceDataVersion(1)
                .execute())
                .thenReturn(existing);

        Event result = service.updateTheMeeting(
                "event-123",
                null,
                "2027-01-10T11:00:00+05:30",
                null);

        assertEquals(existing, result);
        ArgumentCaptor<Event> eventCaptor = ArgumentCaptor.forClass(Event.class);
        verify(calendar.events()).patch(eq("primary"), eq("event-123"), eventCaptor.capture());
        Event patch = eventCaptor.getValue();
        assertEquals("2027-01-10T11:00:00.000+05:30",
                patch.getStart().getDateTime().toStringRfc3339());
        assertEquals("2027-01-10T11:30:00.000+05:30",
                patch.getEnd().getDateTime().toStringRfc3339());
        assertFalse(patch.containsKey("summary"));
    }

    @Test
    void updateTheMeetingRequiresAnEventIdAndAtLeastOneField() {
        assertThrows(IllegalArgumentException.class,
                () -> service.updateTheMeeting(" ", "title", null, null));
        assertThrows(IllegalArgumentException.class,
                () -> service.updateTheMeeting("event-123", " ", null, null));

        verify(calendar, never()).events();
    }

    private static FreeBusyResponse freeBusyResponse(TimePeriod... periods) {
        return new FreeBusyResponse().setCalendars(Map.of(
                "primary",
                new FreeBusyCalendar().setBusy(List.of(periods))
        ));
    }

    private static EventDateTime dateTime(String value) {
        return new EventDateTime()
                .setDateTime(new com.google.api.client.util.DateTime(value));
    }
}
