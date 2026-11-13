package com.meeting.mcp.config;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@Configuration
public class GoogleCalendarConfig {

    private static final GsonFactory JSON_FACTORY =
            GsonFactory.getDefaultInstance();

    @Value("${google.credentials-path}")
    private String credentialsPath;

    @Value("${google.refresh-token:}")
    private String refreshToken;

    @Bean
    public Calendar googleCalendar() throws Exception {

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalStateException(
                    "GOOGLE_REFRESH_TOKEN is not configured"
            );
        }

        Path credentialsFile = Path.of(credentialsPath);

        if (!Files.exists(credentialsFile)) {
            throw new IllegalStateException(
                    "Google OAuth credentials file not found: "
                            + credentialsPath
            );
        }

        NetHttpTransport transport =
                GoogleNetHttpTransport.newTrustedTransport();

        GoogleClientSecrets secrets =
                GoogleClientSecrets.load(
                        JSON_FACTORY,
                        new InputStreamReader(
                                Files.newInputStream(credentialsFile)
                        )
                );

        GoogleCredential credential =
                new GoogleCredential.Builder()
                        .setTransport(transport)
                        .setJsonFactory(JSON_FACTORY)
                        .setClientSecrets(
                                secrets.getDetails().getClientId(),
                                secrets.getDetails().getClientSecret()
                        )
                        .build();

        credential.setRefreshToken(refreshToken);

        return new Calendar.Builder(
                transport,
                JSON_FACTORY,
                credential
        )
                .setApplicationName("MeetingPilot AI")
                .build();
    }
}
