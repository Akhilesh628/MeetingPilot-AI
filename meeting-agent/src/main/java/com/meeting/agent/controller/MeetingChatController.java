package com.meeting.agent.controller;

import com.meeting.agent.dto.ChatRequest;
import com.meeting.agent.dto.ChatResponse;
import com.meeting.agent.service.MeetingAgentService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/meetings")
@CrossOrigin(
        origins = {
                "http://localhost:5175",
                "https://meetingpilot-ai.svksharma252.workers.dev"
        }
)
public class MeetingChatController {

    private final MeetingAgentService meetingAgentService;

    public MeetingChatController(
            MeetingAgentService meetingAgentService) {
        this.meetingAgentService = meetingAgentService;
    }

    @PostMapping("/chat")
    public ChatResponse chat(
            @Valid @RequestBody ChatRequest request) {

        String conversationId =
                request.conversationId() == null
                        || request.conversationId().isBlank()
                        ? UUID.randomUUID().toString()
                        : request.conversationId();

        String response = meetingAgentService.chat(
                request.message(),
                conversationId
        );

        return new ChatResponse(
                conversationId,
                true,
                response
        );
    }

    @GetMapping("/health")
    public String health() {
        return "MeetingPilot AI is running";
    }
}
