package com.beni.dto;

public class RideRequestAvailabilityResponse {

    public int onlineDriverCount;
    public long remainingSeconds;
    public String requestStatus;

    public RideRequestAvailabilityResponse(
            int onlineDriverCount,
            long remainingSeconds,
            String requestStatus
    ) {
        this.onlineDriverCount = Math.max(0, onlineDriverCount);
        this.remainingSeconds = Math.max(0, remainingSeconds);
        this.requestStatus = requestStatus;
    }
}
