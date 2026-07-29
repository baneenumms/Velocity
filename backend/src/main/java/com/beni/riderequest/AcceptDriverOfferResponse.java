package com.beni.riderequest;

import java.math.BigDecimal;

public class AcceptDriverOfferResponse {

    public boolean success;
    public String message;

    public String requestId;
    public String offerId;

    public Integer rideId;
    public String status;

    public Integer driverId;
    public String driverName;

    public Integer vehicleId;
    public String vehicleDescription;
    public String plateNumber;

    public BigDecimal acceptedFare;
    public BigDecimal reservedAmount;

    /*
     * Raw PIN is returned once to the passenger.
     * Only its hash is stored in PostgreSQL.
     */
    public String ridePin;
}