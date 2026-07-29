package com.beni.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "rides")
public class Ride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ride_id")
    public Integer rideId;

    @ManyToOne
    @JoinColumn(name = "passenger_id", nullable = false)
    public Passenger passenger;

    @ManyToOne
    @JoinColumn(name = "driver_id", nullable = false)
    public Driver driver;

    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = false)
    public Vehicle vehicle;

    @Column(name = "pickup_name", nullable = false)
    public String pickupName;

    @Column(name = "pickup_lat", nullable = false)
    public Double pickupLat;

    @Column(name = "pickup_lng", nullable = false)
    public Double pickupLng;

    @Column(name = "dropoff_name", nullable = false)
    public String dropoffName;

    @Column(name = "dropoff_lat", nullable = false)
    public Double dropoffLat;

    @Column(name = "dropoff_lng", nullable = false)
    public Double dropoffLng;

    @Column(name = "distance_km", nullable = false)
    public BigDecimal distanceKm;

    @Column(name = "estimated_fare", nullable = false)
    public BigDecimal estimatedFare;

    @Column(name = "requested_fare", nullable = false)
    public BigDecimal requestedFare;

    @Column(name = "accepted_fare", nullable = false)
    public BigDecimal acceptedFare;

    // CASH or DIGITAL_TRANSFER
    @Column(name = "payment_method", nullable = false)
    public String paymentMethod;

    // Informational only; does not block completion
    @Column(name = "payment_status", nullable = false)
    public String paymentStatus = "PENDING";

    @Enumerated(EnumType.STRING)
    @Column(name = "ride_status", nullable = false)
    public RideStatus rideStatus = RideStatus.ACCEPTED;

    @Column(name = "ride_pin_hash", nullable = false)
    public String ridePinHash;

    // Reserved 12% driver platform fee
    @Column(name = "driver_fee_reserved_amount", nullable = false)
    public BigDecimal walletReservedAmount = BigDecimal.ZERO;

    // Legacy column; always remains zero
    @Column(name = "passenger_wallet_reserved_amount", nullable = false)
    public BigDecimal passengerWalletReservedAmount = BigDecimal.ZERO;

    @Column(name = "platform_fee_amount", nullable = false)
    public BigDecimal platformFeeAmount = BigDecimal.ZERO;

    @Column(name = "cancellation_fee", nullable = false)
    public BigDecimal cancellationFee = BigDecimal.ZERO;

    @Column(name = "cancelled_by")
    public String cancelledBy;

    @Column(name = "cancellation_reason")
    public String cancellationReason;

    @Column(name = "requested_at", nullable = false)
    public LocalDateTime requestedAt;

    @Column(name = "accepted_at", nullable = false)
    public LocalDateTime acceptedAt;

    @Column(name = "started_at")
    public LocalDateTime startedAt;

    @Column(name = "completed_at")
    public LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    public LocalDateTime cancelledAt;

    @PrePersist
    @PreUpdate
    void applyDefaults() {
        if (paymentStatus == null) paymentStatus = "PENDING";
        if (walletReservedAmount == null) walletReservedAmount = BigDecimal.ZERO;
        if (passengerWalletReservedAmount == null) {
            passengerWalletReservedAmount = BigDecimal.ZERO;
        }
        if (platformFeeAmount == null) platformFeeAmount = BigDecimal.ZERO;
        if (cancellationFee == null) cancellationFee = BigDecimal.ZERO;
    }
    @Column(name = "estimated_duration_minutes")
    public Integer estimatedDurationMinutes;

    @Column(name = "fee_deduction_due_at")
    public LocalDateTime feeDeductionDueAt;

    @Column(
            name = "platform_fee_deducted",
            nullable = false
    )
    public Boolean platformFeeDeducted = false;

    @Column(name = "platform_fee_deducted_at")
    public LocalDateTime platformFeeDeductedAt;
}