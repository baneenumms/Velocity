package com.beni.riderequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class DriverOffer {

    public String offerId;
    public String requestId;

    public Integer driverId;
    public String driverName;

    public Integer vehicleId;
    public String vehicleDescription;
    public String plateNumber;

    public BigDecimal offeredFare;
    public BigDecimal requiredReserve;

    public DriverOfferStatus status;

    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}