
import axios from "axios";

const api = axios.create({
    baseURL: "https://meetingpilot-ai-agent.onrender.com/api/meetings",
    headers: {
        "Content-Type": "application/json"
    }
});

export const sendMessage = async (
    message,
    conversationId
) => {
    const response = await api.post("/chat", {
        message,
        conversationId
    });

    return response.data;
};

export default api;
