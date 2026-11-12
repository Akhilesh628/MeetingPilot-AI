package com.meeting.agent.memory;

import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MeetingMemoryService {

    @Bean
    public ChatMemory meetingChatMemory() {

        return MessageWindowChatMemory.builder()
                .maxMessages(20)
                .build();
    }
}
