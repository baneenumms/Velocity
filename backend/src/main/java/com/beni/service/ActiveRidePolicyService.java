package com.beni.service;

import com.beni.repository.RideRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;

@ApplicationScoped
public class ActiveRidePolicyService {

    @Inject
    RideRepository rideRepository;

    public boolean passengerHasActiveRide(
            Integer passengerId
    ) {
        return rideRepository
                .passengerHasActiveRide(
                        passengerId
                );
    }

    public boolean driverHasActiveRide(
            Integer driverId
    ) {
        return rideRepository
                .driverHasActiveRide(
                        driverId
                );
    }

    public void requirePassengerAvailable(
            Integer passengerId
    ) {
        require(
                passengerId != null &&
                        passengerId > 0,
                "Valid passenger ID is required.",
                400
        );

        require(
                !passengerHasActiveRide(
                        passengerId
                ),
                "You already have an active ride. Complete or cancel it before requesting another ride.",
                409
        );
    }

    public void requireDriverAvailable(
            Integer driverId
    ) {
        require(
                driverId != null &&
                        driverId > 0,
                "Valid driver ID is required.",
                400
        );

        require(
                !driverHasActiveRide(
                        driverId
                ),
                "You already have an active ride. Complete or cancel it before viewing requests or sending another offer.",
                409
        );
    }

    private void require(
            boolean condition,
            String message,
            int status
    ) {
        if (!condition) {
            throw new WebApplicationException(
                    message,
                    status
            );
        }
    }
}