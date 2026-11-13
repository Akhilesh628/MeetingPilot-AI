package com.meeting.agent.service;

import com.meeting.agent.agent.MeetingOrchestratorAgent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MeetingAgentServiceTest {

    @Mock
    private MeetingOrchestratorAgent agent;

    @InjectMocks
    private MeetingAgentService service;

    @Test
    void chatDelegatesMessageAndConversationIdToAgent() {
        when(agent.execute("Schedule a meeting", "conversation-123"))
                .thenReturn("Meeting scheduled");

        String response = service.chat("Schedule a meeting", "conversation-123");

        assertEquals("Meeting scheduled", response);
        verify(agent).execute("Schedule a meeting", "conversation-123");
    }
}
