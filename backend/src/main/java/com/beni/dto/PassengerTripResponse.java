package com.beni.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PassengerTripResponse {

    public Integer rideId;

    public String rideStatus;

    public String pickupLocation;

    public String dropoffLocation;

    public BigDecimal distanceKm;

    public BigDecimal finalFare;

    public String paymentMethod;

    public Integer driverId;

    public String driverName;

    public LocalDateTime requestedAt;

    public LocalDateTime acceptedAt;

    public LocalDateTime startedAt;

    public LocalDateTime completedAt;

    public LocalDateTime cancelledAt;

    public String cancelledBy;

    public String cancellationReason;
}