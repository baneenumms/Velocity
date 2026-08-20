package com.beni.dto;

public class RideRequestAvailabilityResponse {

    public int onlineDriverCount;

    public RideRequestAvailabilityResponse(int onlineDriverCount) {
        this.onlineDriverCount = Math.max(0, onlineDriverCount);
    }
}
