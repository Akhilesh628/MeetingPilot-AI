package com.meeting.mcp.exception;

import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.meeting.mcp.exception.CalendarOperationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CalendarOperationException.class)
    public ResponseEntity<ApiError> handleCalendarOperation(
            CalendarOperationException ex) {

        return build(
                ex.getStatus(),
                ex.getErrorCode(),
                ex.getMessage()
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleBadRequest(
            IllegalArgumentException ex) {

        return build(
                HttpStatus.BAD_REQUEST,
                "INVALID_REQUEST",
                ex.getMessage()
        );
    }

    @ExceptionHandler(GoogleJsonResponseException.class)
    public ResponseEntity<ApiError> handleGoogleApiError(
            GoogleJsonResponseException ex) {

        HttpStatus status = mapGoogleStatus(ex.getStatusCode());

        return build(
                status,
                "GOOGLE_CALENDAR_ERROR",
                "Google Calendar rejected the request (HTTP "
                        + ex.getStatusCode() + ")."
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(
            Exception ex) {

        return build(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                "An unexpected error occurred while processing the request."
        );
    }

    private ResponseEntity<ApiError> build(
            HttpStatus status,
            String code,
            String message) {

        ApiError error = new ApiError(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                code,
                message
        );

        return ResponseEntity.status(status).body(error);
    }

    private HttpStatus mapGoogleStatus(int code) {
        return switch (code) {
            case 400 -> HttpStatus.BAD_REQUEST;
            case 401 -> HttpStatus.UNAUTHORIZED;
            case 403 -> HttpStatus.FORBIDDEN;
            case 404 -> HttpStatus.NOT_FOUND;
            case 409 -> HttpStatus.CONFLICT;
            case 429 -> HttpStatus.TOO_MANY_REQUESTS;
            default -> HttpStatus.BAD_GATEWAY;
        };
    }

    public record ApiError(
            Instant timestamp,
            int status,
            String error,
            String code,
            String message
    ) {
    }
}
