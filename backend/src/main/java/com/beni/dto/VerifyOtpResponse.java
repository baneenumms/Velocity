package com.beni.dto;

public class VerifyOtpResponse {

    public boolean success;
    public String message;
    public String nextStep;

    public Integer userId;
    public Integer passengerId;

    public String fullName;
    public String phoneNumber;
    public String email;

    public String sessionToken;
    public String activeMode;
    public String sessionExpiresAt;
}
