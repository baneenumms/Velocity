package com.beni.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PassengerRideResponse {

    public boolean found;
    public boolean active;

    public Integer rideId;
    public Integer passengerId;

    public Integer driverId;
    public String driverName;

    public Integer vehicleId;
    public String vehicleDescription;
    public String plateNumber;

    public String pickupName;
    public Double pickupLat;
    public Double pickupLng;

    public String dropoffName;
    public Double dropoffLat;
    public Double dropoffLng;

    public BigDecimal distanceKm;
    public BigDecimal requestedFare;
    public BigDecimal acceptedFare;

    public String paymentMethod;
    public String status;

    public LocalDateTime requestedAt;
    public LocalDateTime acceptedAt;
    public LocalDateTime startedAt;
    public LocalDateTime completedAt;

    public String cancelledBy;
    public String cancellationReason;
    public LocalDateTime cancelledAt;
}