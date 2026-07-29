
package com.beni.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "drivers")
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "driver_id")
    public Integer driverId;

    @OneToOne
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true
    )
    public User user;

    @Column(
            name = "license_number",
            nullable = false,
            unique = true
    )
    public String licenseNumber;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "driver_status",
            nullable = false
    )
    public DriverStatus driverStatus;

    @Column(name = "current_latitude")
    public Double currentLatitude;

    @Column(name = "current_longitude")
    public Double currentLongitude;

    @Column(name = "location_updated_at")
    public LocalDateTime locationUpdatedAt;

    public Driver() {
    }
}