package com.meeting.agent.service;

import com.meeting.agent.agent.MeetingOrchestratorAgent;
import org.springframework.stereotype.Service;

@Service
public class MeetingAgentService {

    private final MeetingOrchestratorAgent agent;

    public MeetingAgentService(MeetingOrchestratorAgent agent) {
        this.agent = agent;
    }

    public String chat(String message, String conversationId) {

        return agent.execute(message, conversationId);
    }
}
