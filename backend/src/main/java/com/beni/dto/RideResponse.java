package com.beni.dto;

public class RideResponse {

    public Integer rideId;
    public String pickupLocation;
    public String dropoffLocation;
    public Double finalFare;
    public String rideStatus;
    public String requestedAt;
    public String startedAt;
    public String completedAt;

    public RideResponse() {
    }

    public RideResponse(Integer rideId, String pickupLocation, String dropoffLocation, Double finalFare,
                        String rideStatus, String requestedAt, String startedAt, String completedAt) {
        this.rideId = rideId;
        this.pickupLocation = pickupLocation;
        this.dropoffLocation = dropoffLocation;
        this.finalFare = finalFare;
        this.rideStatus = rideStatus;
        this.requestedAt = requestedAt;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
    }
}