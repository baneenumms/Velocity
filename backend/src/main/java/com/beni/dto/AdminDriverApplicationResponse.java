package com.beni.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class AdminDriverApplicationResponse {

    public Integer applicationId;
    public Integer attemptNumber;
    public String status;

    public Integer userId;
    public String accountStatus;
    public boolean existingPassenger;

    public String fullName;
    public String phoneNumber;
    public String email;
    public String cnicNumber;

    public String licenseNumber;

    public String vehicleMake;
    public String vehicleModel;
    public Integer vehicleYear;
    public String vehicleColor;
    public String vehiclePlateNumber;
    public Integer vehicleCapacity;

    public LocalDateTime submittedAt;
    public LocalDateTime reviewedAt;

    public Integer reviewedByUserId;
    public String reviewedByName;
    public String reviewSummary;

    public Integer approvedDriverId;

    public boolean canApprove;
    public boolean canDecline;
    public boolean canSuspend;

    public List<DriverApplicationCorrectionResponse> corrections =
            new ArrayList<>();
}