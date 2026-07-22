package com.beni.service;

import com.beni.dto.AcceptRideRequest;
import com.beni.dto.CreateRideRequest;
import com.beni.dto.CreateRideResponse;
import com.beni.dto.EstimateRideRequest;
import com.beni.dto.EstimateRideResponse;
import com.beni.dto.RideStatusResponse;
import com.beni.entity.Driver;
import com.beni.entity.Passenger;
import com.beni.entity.Ride;
import com.beni.entity.RideStatus;
import com.beni.entity.Vehicle;
import com.beni.repository.DriverRepository;
import com.beni.repository.PassengerRepository;
import com.beni.repository.RideRepository;
import com.beni.repository.VehicleRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@ApplicationScoped
public class RideService {

    @Inject
    RideRepository rideRepository;

    @Inject
    PassengerRepository passengerRepository;

    @Inject
    DriverRepository driverRepository;

    @Inject
    VehicleRepository vehicleRepository;

    private static final double EARTH_RADIUS = 6371.0;
    private static final double BASE_FARE = 150.0;
    private static final double PER_KM_RATE = 40.0;

    public EstimateRideResponse estimateRide(EstimateRideRequest request) {

        double distance = calculateDistance(
                request.pickupLat,
                request.pickupLng,
                request.dropoffLat,
                request.dropoffLng
        );

        double estimatedFare = BASE_FARE + (distance * PER_KM_RATE);

        double minimumFare = estimatedFare * 0.90;
        double maximumFare = estimatedFare * 1.10;

        EstimateRideResponse response = new EstimateRideResponse();

        response.distanceKm = round(distance);
        response.estimatedFare = BigDecimal.valueOf(round(estimatedFare));
        response.minimumFare = BigDecimal.valueOf(round(minimumFare));
        response.maximumFare = BigDecimal.valueOf(round(maximumFare));

        return response;
    }

    @Transactional
    public CreateRideResponse createRide(CreateRideRequest request) {

        CreateRideResponse response = new CreateRideResponse();

        Passenger passenger = passengerRepository.findById(
                request.passengerId.longValue()
        );

        if (passenger == null) {
            response.success = false;
            response.message = "Passenger not found";
            return response;
        }

        Ride ride = new Ride();

        ride.passenger = passenger;

        ride.pickupName = request.pickupName;
        ride.pickupLat = request.pickupLat;
        ride.pickupLng = request.pickupLng;

        ride.dropoffName = request.dropoffName;
        ride.dropoffLat = request.dropoffLat;
        ride.dropoffLng = request.dropoffLng;

        ride.distanceKm = request.distanceKm;
        ride.estimatedFare = request.estimatedFare;
        ride.requestedFare = request.requestedFare;

        ride.rideStatus = RideStatus.SEARCHING;
        ride.requestedAt = LocalDateTime.now();

        rideRepository.persist(ride);

        response.success = true;
        response.message = "Ride created successfully";
        response.rideId = ride.rideId;
        response.status = ride.rideStatus.name();

        return response;
    }

    @Transactional
    public RideStatusResponse acceptRide(AcceptRideRequest request) {

        Ride ride = rideRepository.findById(
                request.rideId.longValue()
        );

        if (ride == null) {
            throw new WebApplicationException(
                    "Ride not found",
                    404
            );
        }

        if (ride.rideStatus != RideStatus.SEARCHING) {
            throw new WebApplicationException(
                    "Only searching rides can be accepted",
                    400
            );
        }

        Driver driver = driverRepository.findById(
                request.driverId.longValue()
        );

        if (driver == null) {
            throw new WebApplicationException(
                    "Driver not found",
                    404
            );
        }

        Vehicle vehicle = vehicleRepository.findById(
                request.vehicleId.longValue()
        );

        if (vehicle == null) {
            throw new WebApplicationException(
                    "Vehicle not found",
                    404
            );
        }

        if (vehicle.driver == null ||
                !vehicle.driver.driverId.equals(driver.driverId)) {

            throw new WebApplicationException(
                    "Vehicle does not belong to this driver",
                    400
            );
        }

        ride.driver = driver;
        ride.vehicle = vehicle;
        ride.acceptedFare = request.acceptedFare;
        ride.rideStatus = RideStatus.ACCEPTED;
        ride.acceptedAt = LocalDateTime.now();

        RideStatusResponse response = new RideStatusResponse();

        response.success = true;
        response.message = "Ride accepted successfully";
        response.rideId = ride.rideId;
        response.status = ride.rideStatus.name();

        return response;
    }

    @Transactional
    public RideStatusResponse startRide(Integer rideId) {

        Ride ride = rideRepository.findById(
                rideId.longValue()
        );

        if (ride == null) {
            throw new WebApplicationException(
                    "Ride not found",
                    404
            );
        }

        if (ride.rideStatus != RideStatus.ACCEPTED) {
            throw new WebApplicationException(
                    "Only accepted rides can be started",
                    400
            );
        }

        ride.rideStatus = RideStatus.IN_PROGRESS;
        ride.startedAt = LocalDateTime.now();

        RideStatusResponse response = new RideStatusResponse();

        response.success = true;
        response.message = "Ride started successfully";
        response.rideId = ride.rideId;
        response.status = ride.rideStatus.name();

        return response;
    }

    @Transactional
    public RideStatusResponse completeRide(Integer rideId) {

        Ride ride = rideRepository.findById(
                rideId.longValue()
        );

        if (ride == null) {
            throw new WebApplicationException(
                    "Ride not found",
                    404
            );
        }

        if (ride.rideStatus != RideStatus.IN_PROGRESS) {
            throw new WebApplicationException(
                    "Only in-progress rides can be completed",
                    400
            );
        }

        ride.rideStatus = RideStatus.COMPLETED;
        ride.completedAt = LocalDateTime.now();

        RideStatusResponse response = new RideStatusResponse();

        response.success = true;
        response.message = "Ride completed successfully";
        response.rideId = ride.rideId;
        response.status = ride.rideStatus.name();

        return response;
    }

    @Transactional
    public RideStatusResponse cancelRide(Integer rideId) {

        Ride ride = rideRepository.findById(
                rideId.longValue()
        );

        if (ride == null) {
            throw new WebApplicationException(
                    "Ride not found",
                    404
            );
        }

        if (ride.rideStatus == RideStatus.COMPLETED ||
                ride.rideStatus == RideStatus.CANCELLED) {

            throw new WebApplicationException(
                    "This ride cannot be cancelled",
                    400
            );
        }

        ride.rideStatus = RideStatus.CANCELLED;

        RideStatusResponse response = new RideStatusResponse();

        response.success = true;
        response.message = "Ride cancelled successfully";
        response.rideId = ride.rideId;
        response.status = ride.rideStatus.name();

        return response;
    }

    private double calculateDistance(
            double lat1,
            double lon1,
            double lat2,
            double lon2
    ) {

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2)
                        * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
        );

        return EARTH_RADIUS * c;
    }

    private double round(double value) {

        return BigDecimal
                .valueOf(value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}