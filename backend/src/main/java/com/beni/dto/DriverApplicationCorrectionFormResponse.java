package com.beni.dto;

import java.util.ArrayList;
import java.util.List;

public class DriverApplicationCorrectionFormResponse {

    public boolean success;
    public String message;

    public Integer applicationId;
    public Integer attemptNumber;

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

    public List<DriverApplicationCorrectionResponse> corrections =
            new ArrayList<>();
}