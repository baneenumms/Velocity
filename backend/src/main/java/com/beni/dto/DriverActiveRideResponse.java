package com.beni.dto;

import java.math.BigDecimal;

public class DriverActiveRideResponse {

    public boolean active;

    public Integer rideId;
    public Integer passengerId;
    public Integer driverId;
    public Integer vehicleId;

    public String pickupName;
    public Double pickupLat;
    public Double pickupLng;

    public String dropoffName;
    public Double dropoffLat;
    public Double dropoffLng;

    public BigDecimal acceptedFare;
    public String paymentMethod;

    public String vehicleDescription;
    public String plateNumber;
    public String status;
}