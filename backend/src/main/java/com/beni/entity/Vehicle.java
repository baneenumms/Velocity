package com.beni.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vehicle_id")
    public Integer vehicleId;

    @ManyToOne
    @JoinColumn(name = "driver_id", nullable = false)
    public Driver driver;

    @Column(name = "make", nullable = false)
    public String make;

    @Column(name = "model", nullable = false)
    public String model;

    @Column(name = "vehicle_year")
    public Integer vehicleYear;

    @Column(name = "color", nullable = false)
    public String color;

    @Column(name = "plate_number", unique = true, nullable = false)
    public String plateNumber;

    @Column(name = "vehicle_type")
    public String vehicleType;

    @Column(name = "capacity")
    public Integer capacity;
}