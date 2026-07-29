package com.beni.dto;

import java.math.BigDecimal;

public class CreateRideRequest {

    public Integer passengerId;

    /*
     * Earlier frontend field names.
     */
    public String pickupName;
    public Double pickupLat;
    public Double pickupLng;

    public String dropoffName;
    public Double dropoffLat;
    public Double dropoffLng;

    public BigDecimal distanceKm;
    public BigDecimal estimatedFare;
    public BigDecimal requestedFare;

    /*
     * Estimated journey duration calculated
     * by the passenger route service.
     */
    public Integer estimatedDurationMinutes;

    /*
     * Current frontend field names.
     */
    public String pickupAddress;
    public Double pickupLatitude;
    public Double pickupLongitude;

    public String dropoffAddress;
    public Double dropoffLatitude;
    public Double dropoffLongitude;

    public Double passengerFare;

    /*
     * Allowed values:
     * CASH
     * DIGITAL_TRANSFER
     *
     * This is only the passenger's preferred
     * payment method. Velocity does not process
     * the ride payment.
     */
    public String paymentMethod;

    public CreateRideRequest() {
    }
}