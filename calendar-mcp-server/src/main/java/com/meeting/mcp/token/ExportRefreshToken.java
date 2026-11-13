
package com.meeting.mcp.token;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.calendar.CalendarScopes;

import java.io.File;
import java.io.FileReader;
import java.util.List;

public class ExportRefreshToken {

    private static final String PROJECT_PATH =
            "D:/AI/MeetingAgent/MeetingPilot-AI/calendar-mcp-server";

    public static void main(String[] args) throws Exception {

        File credentialsFile = new File(
                PROJECT_PATH + "/credentials/credentials.json"
        );

        File tokenDirectory = new File(
                PROJECT_PATH + "/tokens"
        );

        if (!credentialsFile.exists()) {
            throw new IllegalStateException(
                    "Credentials file not found: "
                            + credentialsFile.getAbsolutePath()
            );
        }

        if (!tokenDirectory.exists()) {
            throw new IllegalStateException(
                    "Token directory not found: "
                            + tokenDirectory.getAbsolutePath()
            );
        }

        var transport =
                GoogleNetHttpTransport.newTrustedTransport();

        var jsonFactory =
                GsonFactory.getDefaultInstance();

        var secrets = GoogleClientSecrets.load(
                jsonFactory,
                new FileReader(credentialsFile)
        );

        var flow = new GoogleAuthorizationCodeFlow.Builder(
                transport,
                jsonFactory,
                secrets,
                List.of(CalendarScopes.CALENDAR)
        )
                .setDataStoreFactory(
                        new FileDataStoreFactory(tokenDirectory)
                )
                .setAccessType("offline")
                .build();

        var credential = flow.loadCredential(
                "meetingpilot-user"
        );

        if (credential == null) {
            throw new IllegalStateException(
                    "No stored credential found for meetingpilot-user"
            );
        }

        String refreshToken = credential.getRefreshToken();

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalStateException(
                    "Refresh token is missing. New OAuth authorization is required."
            );
        }

        System.out.println("Refresh token found successfully.");
        System.out.println(
                "GOOGLE_REFRESH_TOKEN=" + refreshToken
        );
    }
}
