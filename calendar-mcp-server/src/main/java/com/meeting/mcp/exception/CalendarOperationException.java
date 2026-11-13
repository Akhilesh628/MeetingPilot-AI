package com.meeting.mcp.exception;
import org.springframework.http.HttpStatus;

public class CalendarOperationException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public CalendarOperationException(
            String message,
            String errorCode,
            HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }

    public CalendarOperationException(
            String message,
            String errorCode,
            HttpStatus status,
            Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
