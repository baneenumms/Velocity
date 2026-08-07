package com.beni.riderequest;

import java.time.LocalDateTime;

public class RideRequest {

    public String requestId;

    public Integer passengerId;

    public Double pickupLatitude;
    public Double pickupLongitude;
    public String pickupAddress;

    public Double dropoffLatitude;
    public Double dropoffLongitude;
    public String dropoffAddress;

    /*
     * Original fare calculated
     * by Velocity.
     */
    public Double estimatedFare;

    /*
     * Fare currently offered
     * by the passenger.
     */
    public Double passengerFare;

    /*
     * Estimated trip duration
     * in minutes.
     */
    public Integer
            estimatedDurationMinutes;

    /*
     * CASH or DIGITAL_TRANSFER.
     *
     * This only records how the
     * passenger intends to pay.
     * Velocity does not process
     * the passenger's ride payment.
     */
    public String paymentMethod;

    public RideRequestStatus status;

    /*
     * Original creation time.
     */
    public LocalDateTime createdAt;

    /*
     * Last fare-change time.
     * Changing the fare does not
     * restart the 15-minute timer.
     */
    public LocalDateTime fareUpdatedAt;

    /*
     * Search expiry time.
     */
    public LocalDateTime expiresAt;

    public RideRequest() {
    }
}