package com.beni.dto;

public class VehicleResponse {

    public Integer vehicleId;
    public String make;
    public String model;
    public Integer vehicleYear;
    public String color;
    public String plateNumber;
    public String vehicleType;
    public Integer capacity;

    public VehicleResponse() {
    }

    public VehicleResponse(Integer vehicleId, String make, String model, Integer vehicleYear,
                           String color, String plateNumber, String vehicleType, Integer capacity) {
        this.vehicleId = vehicleId;
        this.make = make;
        this.model = model;
        this.vehicleYear = vehicleYear;
        this.color = color;
        this.plateNumber = plateNumber;
        this.vehicleType = vehicleType;
        this.capacity = capacity;
    }
}