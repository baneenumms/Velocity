package com.beni.dto;

import java.math.BigDecimal;

public class CreateRideRequest {

    public Integer passengerId;

    public String pickupName;
    public Double pickupLat;
    public Double pickupLng;

    public String dropoffName;
    public Double dropoffLat;
    public Double dropoffLng;

    public BigDecimal distanceKm;

    public BigDecimal estimatedFare;

    public BigDecimal requestedFare;

}