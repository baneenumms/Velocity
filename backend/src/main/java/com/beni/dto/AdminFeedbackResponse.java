package com.beni.dto;

import java.time.LocalDateTime;

public class AdminFeedbackResponse {

    public Integer feedbackId;
    public Integer rideId;
    public String rideStatus;

    public String submittedBy;
    public Integer rating;
    public String comment;
    public String reportCategory;
    public LocalDateTime createdAt;

    public Integer passengerId;
    public Integer passengerUserId;
    public String passengerName;
    public String passengerAccountStatus;

    public Integer driverId;
    public Integer driverUserId;
    public String driverName;
    public String driverAccountStatus;
}