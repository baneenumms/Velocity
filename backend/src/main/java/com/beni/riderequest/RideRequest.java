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
     * Original fare calculated by Velocity.
     */
    public Double estimatedFare;

    /*
     * Fare currently offered by the passenger.
     */
    public Double passengerFare;

    /*
     * Estimated trip duration in minutes.
     */
    public Integer estimatedDurationMinutes;

    /*
     * CASH or DIGITAL_TRANSFER
     *
     * This only tells the driver how the passenger
     * intends to pay. Velocity does not process
     * the ride payment.
     */
    public String paymentMethod;

    public RideRequestStatus status;

    /*
     * Time when the request was originally created.
     */
    public LocalDateTime createdAt;

    /*
     * Time when the passenger last changed the fare.
     * Updating the fare does not restart the
     * 15-minute request lifetime.
     */
    public LocalDateTime fareUpdatedAt;

    /*
     * The request expires 15 minutes after createdAt.
     */
    public LocalDateTime expiresAt;

    public RideRequest() {
    }
}