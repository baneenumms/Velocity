
package com.beni.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "drivers")
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "driver_id")
    public Integer driverId;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    public User user;

    @Column(name = "license_number", unique = true, nullable = false)
    public String licenseNumber;

    @Column(name = "driver_status")
    public String driverStatus;
}