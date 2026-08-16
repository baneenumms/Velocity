package com.beni.service;

import com.beni.entity.AuthSession;
import com.beni.entity.Driver;
import com.beni.entity.Passenger;
import com.beni.entity.Ride;
import com.beni.repository.DriverRepository;
import com.beni.repository.PassengerRepository;
import com.beni.repository.RideRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;

@ApplicationScoped
public class ResourceAuthorizationService {

    @Inject
    SessionService sessionService;

    @Inject
    DriverRepository driverRepository;

    @Inject
    PassengerRepository passengerRepository;

    @Inject
    RideRepository rideRepository;

    public Driver requireDriver(
            String authorizationHeader,
            Integer requestedDriverId
    ) {
        requirePositiveId(
                requestedDriverId,
                "Valid driver ID is required."
        );

        Driver authenticatedDriver =
                authenticatedDriver(
                        authorizationHeader
                );

        require(
                requestedDriverId.equals(
                        authenticatedDriver.driverId
                ),
                "Driver access is limited to your own account.",
                403
        );

        return authenticatedDriver;
    }

    public Driver requireDriver(
            String authorizationHeader
    ) {
        return authenticatedDriver(
                authorizationHeader
        );
    }

    public Passenger requirePassenger(
            String authorizationHeader,
            Integer requestedPassengerId
    ) {
        requirePositiveId(
                requestedPassengerId,
                "Valid passenger ID is required."
        );

        Passenger authenticatedPassenger =
                authenticatedPassenger(
                        authorizationHeader
                );

        require(
                requestedPassengerId.equals(
                        authenticatedPassenger.passengerId
                ),
                "Passenger access is limited to your own account.",
                403
        );

        return authenticatedPassenger;
    }

    public Ride requireDriverRide(
            String authorizationHeader,
            Integer rideId
    ) {
        requirePositiveId(
                rideId,
                "Valid ride ID is required."
        );

        Driver driver =
                authenticatedDriver(
                        authorizationHeader
                );

        Ride ride =
                rideRepository
                        .findByIdAndDriverId(
                                rideId,
                                driver.driverId
                        );

        require(
                ride != null,
                "This ride does not belong to the authenticated driver.",
                403
        );

        return ride;
    }

    public Ride requirePassengerRide(
            String authorizationHeader,
            Integer rideId
    ) {
        requirePositiveId(
                rideId,
                "Valid ride ID is required."
        );

        Passenger passenger =
                authenticatedPassenger(
                        authorizationHeader
                );

        Ride ride =
                rideRepository
                        .findByIdAndPassengerId(
                                rideId,
                                passenger.passengerId
                        );

        require(
                ride != null,
                "This ride does not belong to the authenticated passenger.",
                403
        );

        return ride;
    }

    public RideParticipant requireRideParticipant(
            String authorizationHeader,
            Integer rideId
    ) {
        requirePositiveId(
                rideId,
                "Valid ride ID is required."
        );

        AuthSession session =
                sessionService.requireValidSession(
                        authorizationHeader
                );

        String mode =
                session.activeMode == null
                        ? ""
                        : session.activeMode
                        .trim()
                        .toUpperCase();

        if ("DRIVER".equals(mode)) {
            Driver driver =
                    driverRepository.findByUser(
                            session.user
                    );

            require(
                    driver != null,
                    "An approved driver account is required.",
                    403
            );

            Ride ride =
                    rideRepository
                            .findByIdAndDriverId(
                                    rideId,
                                    driver.driverId
                            );

            require(
                    ride != null,
                    "This ride does not belong to the authenticated driver.",
                    403
            );

            return new RideParticipant(
                    ride,
                    "DRIVER",
                    null,
                    driver.driverId
            );
        }

        if ("PASSENGER".equals(mode)) {
            Passenger passenger =
                    passengerRepository.findByUser(
                            session.user
                    );

            require(
                    passenger != null,
                    "A passenger account is required.",
                    403
            );

            Ride ride =
                    rideRepository
                            .findByIdAndPassengerId(
                                    rideId,
                                    passenger.passengerId
                            );

            require(
                    ride != null,
                    "This ride does not belong to the authenticated passenger.",
                    403
            );

            return new RideParticipant(
                    ride,
                    "PASSENGER",
                    passenger.passengerId,
                    null
            );
        }

        throw new WebApplicationException(
                "Passenger or driver mode is required.",
                403
        );
    }

    private Driver authenticatedDriver(
            String authorizationHeader
    ) {
        AuthSession session =
                sessionService.requireMode(
                        authorizationHeader,
                        "DRIVER"
                );

        Driver driver =
                driverRepository.findByUser(
                        session.user
                );

        require(
                driver != null,
                "An approved driver account is required.",
                403
        );

        return driver;
    }

    private Passenger authenticatedPassenger(
            String authorizationHeader
    ) {
        AuthSession session =
                sessionService.requireMode(
                        authorizationHeader,
                        "PASSENGER"
                );

        Passenger passenger =
                passengerRepository.findByUser(
                        session.user
                );

        require(
                passenger != null,
                "A passenger account is required.",
                403
        );

        return passenger;
    }

    private void requirePositiveId(
            Integer id,
            String message
    ) {
        require(
                id != null && id > 0,
                message,
                400
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

    public record RideParticipant(
            Ride ride,
            String role,
            Integer passengerId,
            Integer driverId
    ) {
    }
}
