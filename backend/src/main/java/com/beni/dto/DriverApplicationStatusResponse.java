package com.beni.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class DriverApplicationStatusResponse {

    public boolean success;
    public String message;

    public Integer userId;
    public Integer applicationId;
    public Integer attemptNumber;
    public String applicationStatus;

    public String reviewSummary;

    public LocalDateTime submittedAt;
    public LocalDateTime reviewedAt;

    public boolean canGoOnline;
    public boolean walletEnabled;
    public boolean canViewRideOffers;

    public Integer driverId;
    public String applicantToken;

    public String sessionToken;
    public String activeMode;
    public String sessionExpiresAt;

    public List<DriverApplicationCorrectionResponse> corrections =
            new ArrayList<>();
}
