package com.beni.riderequest;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.LocalDateTime;

@Entity
@Table(name = "ride_requests")
public class RideRequest {

    @Id
    @Column(
            name = "request_id",
            nullable = false,
            updatable = false,
            length = 36
    )
    public String requestId;

    @Column(name = "passenger_id", nullable = false)
    public Integer passengerId;

    @Column(name = "pickup_latitude", nullable = false)
    public Double pickupLatitude;

    @Column(name = "pickup_longitude", nullable = false)
    public Double pickupLongitude;

    @Column(
            name = "pickup_address",
            nullable = false,
            length = 500
    )
    public String pickupAddress;

    @Column(name = "dropoff_latitude", nullable = false)
    public Double dropoffLatitude;

    @Column(name = "dropoff_longitude", nullable = false)
    public Double dropoffLongitude;

    @Column(
            name = "dropoff_address",
            nullable = false,
            length = 500
    )
    public String dropoffAddress;

    /*
     * Original fare calculated
     * by Velocity.
     */
    @Column(name = "estimated_fare", nullable = false)
    public Double estimatedFare;

    /*
     * Fare currently offered
     * by the passenger.
     */
    @Column(name = "passenger_fare", nullable = false)
    public Double passengerFare;

    /*
     * Estimated trip duration
     * in minutes.
     */
    @Column(
            name = "estimated_duration_minutes",
            nullable = false
    )
    public Integer estimatedDurationMinutes;

    /*
     * CASH or DIGITAL_TRANSFER.
     *
     * This only records how the
     * passenger intends to pay.
     * Velocity does not process
     * the passenger's ride payment.
     */
    @Column(
            name = "payment_method",
            nullable = false,
            length = 30
    )
    public String paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "request_status",
            nullable = false,
            length = 20
    )
    public RideRequestStatus status;

    /*
     * Original creation time.
     */
    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    public LocalDateTime createdAt;

    /*
     * Last fare-change time.
     * Changing the fare does not
     * restart the 15-minute timer.
     */
    @Column(name = "fare_updated_at")
    public LocalDateTime fareUpdatedAt;

    /*
     * Search expiry time.
     */
    @Column(name = "expires_at", nullable = false)
    public LocalDateTime expiresAt;

    @JsonIgnore
    @Version
    @Column(name = "version", nullable = false)
    public Long version;

    public RideRequest() {
    }
}
