package com.meeting.agent.memory;

import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.UserMessage;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class MeetingMemoryServiceTest {

    @Test
    void meetingChatMemoryCreatesUsableConversationMemory() {
        ChatMemory memory = new MeetingMemoryService().meetingChatMemory();

        assertNotNull(memory);

        memory.add("conversation-123", new UserMessage("Hello"));

        assertEquals(1, memory.get("conversation-123").size());
        assertEquals("Hello", memory.get("conversation-123").getFirst().getText());
    }
}
