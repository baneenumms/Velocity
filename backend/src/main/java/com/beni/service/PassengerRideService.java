package com.beni.service;

import com.beni.dto.PassengerRideResponse;
import com.beni.entity.Ride;
import com.beni.entity.RideStatus;
import com.beni.repository.RideRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;

@ApplicationScoped
public class PassengerRideService {

    @Inject
    RideRepository rideRepository;

    public PassengerRideResponse getLatestRide(
            Integer passengerId
    ) {
        if (passengerId == null || passengerId <= 0) {
            throw new WebApplicationException(
                    "Valid passenger ID is required",
                    400
            );
        }

        Ride ride = rideRepository.find(
                "passenger.passengerId = ?1 " +
                        "order by rideId desc",
                passengerId
        ).firstResult();

        PassengerRideResponse response =
                new PassengerRideResponse();

        if (ride == null) {
            response.found = false;
            response.active = false;
            return response;
        }

        response.found = true;

        response.active =
                ride.rideStatus == RideStatus.ACCEPTED ||
                        ride.rideStatus == RideStatus.IN_PROGRESS;

        response.rideId = ride.rideId;
        response.passengerId =
                ride.passenger.passengerId;

        response.driverId =
                ride.driver.driverId;

        response.driverName =
                ride.driver.user.fullName;

        response.vehicleId =
                ride.vehicle.vehicleId;

        response.vehicleDescription =
                ride.vehicle.make + " " +
                        ride.vehicle.model;

        response.plateNumber =
                ride.vehicle.plateNumber;

        response.pickupName = ride.pickupName;
        response.pickupLat = ride.pickupLat;
        response.pickupLng = ride.pickupLng;

        response.dropoffName = ride.dropoffName;
        response.dropoffLat = ride.dropoffLat;
        response.dropoffLng = ride.dropoffLng;

        response.distanceKm = ride.distanceKm;
        response.requestedFare = ride.requestedFare;
        response.acceptedFare = ride.acceptedFare;

        response.paymentMethod =
                ride.paymentMethod;

        response.status =
                ride.rideStatus.name();

        response.requestedAt = ride.requestedAt;
        response.acceptedAt = ride.acceptedAt;
        response.startedAt = ride.startedAt;
        response.completedAt = ride.completedAt;

        response.cancelledBy = ride.cancelledBy;
        response.cancellationReason =
                ride.cancellationReason;
        response.cancelledAt = ride.cancelledAt;

        return response;
    }
}