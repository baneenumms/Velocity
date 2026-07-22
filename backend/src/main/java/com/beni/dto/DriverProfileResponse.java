package com.beni.dto;

import java.util.List;

public class DriverProfileResponse {

    public Integer userId;
    public String fullName;
    public String phoneNumber;
    public String email;
    public String role;

    public Integer driverId;
    public String licenseNumber;
    public String driverStatus;

    public List<VehicleResponse> vehicles;

    public DriverProfileResponse() {
    }

    public DriverProfileResponse(Integer userId, String fullName, String phoneNumber, String email, String role,
                                 Integer driverId, String licenseNumber, String driverStatus,
                                 List<VehicleResponse> vehicles) {
        this.userId = userId;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.role = role;
        this.driverId = driverId;
        this.licenseNumber = licenseNumber;
        this.driverStatus = driverStatus;
        this.vehicles = vehicles;
    }
}