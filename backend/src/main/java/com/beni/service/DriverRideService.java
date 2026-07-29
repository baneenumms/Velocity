package com.beni.service;

import com.beni.dto.DriverActiveRideResponse;
import com.beni.entity.Ride;
import com.beni.entity.RideStatus;
import com.beni.repository.RideRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;

@ApplicationScoped
public class DriverRideService {

    @Inject
    RideRepository rideRepository;

    public DriverActiveRideResponse getActiveRide(
            Integer driverId
    ) {
        if (driverId == null || driverId <= 0) {
            throw new WebApplicationException(
                    "Valid driver ID is required",
                    400
            );
        }

        Ride ride = rideRepository.find(
                "driver.driverId = ?1 and " +
                        "(rideStatus = ?2 or rideStatus = ?3) " +
                        "order by acceptedAt desc",
                driverId,
                RideStatus.ACCEPTED,
                RideStatus.IN_PROGRESS
        ).firstResult();

        DriverActiveRideResponse response =
                new DriverActiveRideResponse();

        if (ride == null) {
            response.active = false;
            return response;
        }

        response.active = true;
        response.rideId = ride.rideId;
        response.passengerId = ride.passenger.passengerId;
        response.driverId = ride.driver.driverId;
        response.vehicleId = ride.vehicle.vehicleId;

        response.pickupName = ride.pickupName;
        response.pickupLat = ride.pickupLat;
        response.pickupLng = ride.pickupLng;

        response.dropoffName = ride.dropoffName;
        response.dropoffLat = ride.dropoffLat;
        response.dropoffLng = ride.dropoffLng;

        response.acceptedFare = ride.acceptedFare;
        response.paymentMethod = ride.paymentMethod;

        response.vehicleDescription =
                ride.vehicle.make + " " +
                        ride.vehicle.model;

        response.plateNumber =
                ride.vehicle.plateNumber;

        response.status =
                ride.rideStatus.name();

        return response;
    }
}