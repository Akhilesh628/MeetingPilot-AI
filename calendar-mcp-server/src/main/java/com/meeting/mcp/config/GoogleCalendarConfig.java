package com.meeting.mcp.config;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

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

    @Value("${google.token-directory}")
    private String tokenDirectory;

    @Bean
    @Lazy
    public Calendar googleCalendar() throws Exception {

        NetHttpTransport transport =
                GoogleNetHttpTransport.newTrustedTransport();

        GoogleClientSecrets secrets =
                GoogleClientSecrets.load(
                        JSON_FACTORY,
                        new InputStreamReader(
                                Files.newInputStream(
                                        Path.of(credentialsPath)
                                )
                        )
                );

        Path tokenPath = Path.of(tokenDirectory);
        Files.createDirectories(tokenPath);

        GoogleAuthorizationCodeFlow flow =
                new GoogleAuthorizationCodeFlow.Builder(
                        transport,
                        JSON_FACTORY,
                        secrets,
                        List.of(CalendarScopes.CALENDAR)
                )
                        .setDataStoreFactory(
                                new FileDataStoreFactory(tokenPath.toFile())
                        )
                        .setAccessType("offline")
                        .build();

        LocalServerReceiver receiver =
                new LocalServerReceiver.Builder()
                        .setPort(8888)
                        .build();

        Credential credential =
                new AuthorizationCodeInstalledApp(
                        flow,
                        receiver
                ).authorize("meetingpilot-user");

        return new Calendar.Builder(
                transport,
                JSON_FACTORY,
                credential
        )
                .setApplicationName("MeetingPilot AI")
                .build();
    }
}

