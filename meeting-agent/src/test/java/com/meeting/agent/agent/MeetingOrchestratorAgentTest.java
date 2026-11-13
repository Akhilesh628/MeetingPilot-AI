package com.meeting.agent.agent;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;

import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MeetingOrchestratorAgentTest {

    @Mock(answer = org.mockito.Answers.RETURNS_DEEP_STUBS)
    private ChatClient chatClient;

    @Test
    void executePassesMessageAndConversationIdAndReturnsChatContent() {
        when(chatClient.prompt()
                .system(anyString())
                .user("Find a free slot")
                .advisors(org.mockito.ArgumentMatchers
                        .<Consumer<ChatClient.AdvisorSpec>>any())
                .call()
                .content())
                .thenReturn("There is a free slot at 10:00.");

        MeetingOrchestratorAgent agent = new MeetingOrchestratorAgent(chatClient);

        String response = agent.execute("Find a free slot", "conversation-123");

        assertEquals("There is a free slot at 10:00.", response);
    }
}
