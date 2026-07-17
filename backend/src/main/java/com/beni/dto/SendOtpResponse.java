package com.beni.dto;

public class SendOtpResponse {

    public boolean success;
    public String maskedEmail;
    public String message;

    public SendOtpResponse() {
    }

    public SendOtpResponse(boolean success, String maskedEmail, String message) {
        this.success = success;
        this.maskedEmail = maskedEmail;
        this.message = message;
    }
}