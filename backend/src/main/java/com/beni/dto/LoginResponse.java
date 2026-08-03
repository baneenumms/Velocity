package com.beni.dto;

public class LoginResponse {

    public boolean success;
    public String message;

    public Integer driverId;
    public Integer userId;
    public String fullName;

    public boolean isAdmin;
    public String adminToken;

    public String nextStep;
    public String applicationStatus;
    public String applicantToken;

    public boolean canGoOnline;
    public boolean walletEnabled;
    public boolean canViewRideOffers;
}