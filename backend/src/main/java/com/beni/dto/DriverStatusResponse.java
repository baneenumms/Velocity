package com.beni.dto;

public class DriverStatusResponse {

    public Integer driverId;
    public Integer userId;
    public String status;
    public Double latitude;
    public Double longitude;

    public DriverStatusResponse() {
    }

    public DriverStatusResponse(
            Integer driverId,
            Integer userId,
            String status,
            Double latitude,
            Double longitude
    ) {
        this.driverId = driverId;
        this.userId = userId;
        this.status = status;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}