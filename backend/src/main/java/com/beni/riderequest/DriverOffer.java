package com.beni.riderequest;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "driver_offers")
public class DriverOffer {

    @Id
    @Column(
            name = "offer_id",
            nullable = false,
            updatable = false,
            length = 36
    )
    public String offerId;

    @Column(
            name = "request_id",
            nullable = false,
            updatable = false,
            length = 36
    )
    public String requestId;

    @Column(
            name = "driver_id",
            nullable = false,
            updatable = false
    )
    public Integer driverId;

    @Column(
            name = "driver_name",
            nullable = false,
            length = 150
    )
    public String driverName;

    @Column(name = "vehicle_id", nullable = false)
    public Integer vehicleId;

    @Column(
            name = "vehicle_description",
            nullable = false,
            length = 200
    )
    public String vehicleDescription;

    @Column(
            name = "plate_number",
            nullable = false,
            length = 50
    )
    public String plateNumber;

    @Column(
            name = "offered_fare",
            nullable = false,
            precision = 10,
            scale = 2
    )
    public BigDecimal offeredFare;

    @Column(
            name = "required_reserve",
            nullable = false,
            precision = 10,
            scale = 2
    )
    public BigDecimal requiredReserve;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "offer_status",
            nullable = false,
            length = 20
    )
    public DriverOfferStatus status;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @JsonIgnore
    @Version
    @Column(name = "version", nullable = false)
    public Long version;
}
