package com.beni.dto;

public class DriverStatusResponse {

    public Integer driverId;
    public Integer userId;
    public String status;

    public DriverStatusResponse(Integer driverId, Integer userId, String status) {
        this.driverId = driverId;
        this.userId = userId;
        this.status = status;
    }

    // Default constructor for JSON
    public DriverStatusResponse() {
    }
}