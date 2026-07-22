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
    @JoinColumn(name = "driver_id")
    public Driver driver;

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    public Vehicle vehicle;

    @Column(name = "pickup_name")
    public String pickupName;

    @Column(name = "pickup_lat")
    public Double pickupLat;

    @Column(name = "pickup_lng")
    public Double pickupLng;

    @Column(name = "dropoff_name")
    public String dropoffName;

    @Column(name = "dropoff_lat")
    public Double dropoffLat;

    @Column(name = "dropoff_lng")
    public Double dropoffLng;

    @Column(name = "distance_km")
    public BigDecimal distanceKm;

    @Column(name = "estimated_fare")
    public BigDecimal estimatedFare;

    @Column(name = "requested_fare")
    public BigDecimal requestedFare;

    @Column(name = "accepted_fare")
    public BigDecimal acceptedFare;

    @Enumerated(EnumType.STRING)
    @Column(name = "ride_status")
    public RideStatus rideStatus;

    @Column(name = "requested_at")
    public LocalDateTime requestedAt;

    @Column(name = "accepted_at")
    public LocalDateTime acceptedAt;

    @Column(name = "started_at")
    public LocalDateTime startedAt;

    @Column(name = "completed_at")
    public LocalDateTime completedAt;
}