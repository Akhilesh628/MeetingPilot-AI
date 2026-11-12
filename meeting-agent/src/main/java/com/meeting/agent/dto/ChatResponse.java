package com.meeting.agent.dto;

public record ChatResponse(
        String conversationId, boolean success,
        String response
) {}

