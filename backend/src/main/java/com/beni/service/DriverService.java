package com.beni.service;

import com.beni.dto.DriverProfileResponse;
import com.beni.dto.DriverRequest;
import com.beni.dto.DriverStatusRequest;
import com.beni.dto.DriverStatusResponse;
import com.beni.dto.RideResponse;
import com.beni.dto.VehicleResponse;
import com.beni.dto.WalletResponse;
import com.beni.entity.Driver;
import com.beni.entity.DriverStatus;
import com.beni.entity.User;
import com.beni.entity.Wallet;
import com.beni.repository.DriverRepository;
import com.beni.repository.UserRepository;
import com.beni.repository.VehicleRepository;
import com.beni.repository.WalletRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import com.beni.entity.Ride;
import com.beni.repository.RideRepository;

@ApplicationScoped
public class DriverService {

    @Inject
    DriverRepository driverRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    VehicleRepository vehicleRepository;

    @Inject
    WalletRepository walletRepository;

    @Inject
    RideRepository rideRepository;

    @Transactional
    public Driver createDriver(
            DriverRequest request
    ) {
        if (request == null) {
            throw new WebApplicationException(
                    "Request body is required",
                    Response.Status.BAD_REQUEST
            );
        }

        if (request.userId == null) {
            throw new WebApplicationException(
                    "User ID is required",
                    Response.Status.BAD_REQUEST
            );
        }

        if (request.licenseNumber == null ||
                request.licenseNumber.trim().isEmpty()) {

            throw new WebApplicationException(
                    "License number is required",
                    Response.Status.BAD_REQUEST
            );
        }

        User user = userRepository.findById(
                request.userId.longValue()
        );

        if (user == null) {
            throw new WebApplicationException(
                    "User not found",
                    Response.Status.NOT_FOUND
            );
        }

        if (user.role == null ||
                !user.role.equalsIgnoreCase("driver")) {

            throw new WebApplicationException(
                    "User is not a driver",
                    Response.Status.BAD_REQUEST
            );
        }

        Driver existingDriver =
                driverRepository.findByUser(user);

        if (existingDriver != null) {
            throw new WebApplicationException(
                    "Driver already exists for this user",
                    Response.Status.CONFLICT
            );
        }

        Driver driver = new Driver();

        driver.user = user;
        driver.licenseNumber =
                request.licenseNumber.trim();

        driver.driverStatus =
                DriverStatus.Offline;

        driver.currentLatitude = null;
        driver.currentLongitude = null;
        driver.locationUpdatedAt = null;

        driverRepository.persist(driver);

        return driver;
    }

    public List<Driver> getAllDrivers() {
        return driverRepository.listAll();
    }

    @Transactional
    public DriverStatusResponse updateDriverStatus(
            DriverStatusRequest request
    ) {
        if (request == null) {
            throw new WebApplicationException(
                    "Request body is required",
                    Response.Status.BAD_REQUEST
            );
        }

        if (request.driverId == null) {
            throw new WebApplicationException(
                    "Driver ID is required",
                    Response.Status.BAD_REQUEST
            );
        }

        if (request.status == null ||
                request.status.trim().isEmpty()) {

            throw new WebApplicationException(
                    "Driver status is required",
                    Response.Status.BAD_REQUEST
            );
        }

        String requestedStatus =
                normalizeDashboardStatus(request.status);

        Driver driver = driverRepository.findById(
                request.driverId.longValue()
        );

        if (driver == null) {
            throw new WebApplicationException(
                    "Driver not found",
                    Response.Status.NOT_FOUND
            );
        }

        if ("Online".equals(requestedStatus)) {
            if (request.latitude == null ||
                    request.longitude == null) {

                throw new WebApplicationException(
                        "Location is required before going online",
                        Response.Status.BAD_REQUEST
                );
            }

            validateCoordinates(
                    request.latitude,
                    request.longitude
            );

            driver.currentLatitude =
                    request.latitude;

            driver.currentLongitude =
                    request.longitude;

            driver.locationUpdatedAt =
                    LocalDateTime.now();

            driver.driverStatus =
                    DriverStatus.Online;
        } else {
            /*
             * Keep the driver's latest known coordinates when
             * the driver goes offline.
             */
            if (request.latitude != null &&
                    request.longitude != null) {

                validateCoordinates(
                        request.latitude,
                        request.longitude
                );

                driver.currentLatitude =
                        request.latitude;

                driver.currentLongitude =
                        request.longitude;

                driver.locationUpdatedAt =
                        LocalDateTime.now();
            }

            driver.driverStatus =
                    DriverStatus.Offline;
        }

        return new DriverStatusResponse(
                driver.driverId,
                driver.user.userId,
                driver.driverStatus.name(),
                driver.currentLatitude,
                driver.currentLongitude
        );
    }

    private String normalizeDashboardStatus(
            String status
    ) {
        String value = status.trim();

        if (value.equalsIgnoreCase("Online")) {
            return "Online";
        }

        if (value.equalsIgnoreCase("Offline")) {
            return "Offline";
        }

        throw new WebApplicationException(
                "Only Online or Offline status is allowed",
                Response.Status.BAD_REQUEST
        );
    }

    private void validateCoordinates(
            Double latitude,
            Double longitude
    ) {
        if (latitude < -90 ||
                latitude > 90) {

            throw new WebApplicationException(
                    "Latitude must be between -90 and 90",
                    Response.Status.BAD_REQUEST
            );
        }

        if (longitude < -180 ||
                longitude > 180) {

            throw new WebApplicationException(
                    "Longitude must be between -180 and 180",
                    Response.Status.BAD_REQUEST
            );
        }
    }

    public Driver getDriverByUserId(
            Integer userId
    ) {
        if (userId == null) {
            throw new WebApplicationException(
                    "User ID is required",
                    Response.Status.BAD_REQUEST
            );
        }

        User user = userRepository.findById(
                userId.longValue()
        );

        if (user == null) {
            throw new WebApplicationException(
                    "User not found",
                    Response.Status.NOT_FOUND
            );
        }

        Driver driver =
                driverRepository.findByUser(user);

        if (driver == null) {
            throw new WebApplicationException(
                    "Driver not found for given user",
                    Response.Status.NOT_FOUND
            );
        }

        return driver;
    }

    public DriverProfileResponse getDriverProfile(
            Integer driverId
    ) {
        if (driverId == null) {
            throw new WebApplicationException(
                    "Driver ID is required",
                    Response.Status.BAD_REQUEST
            );
        }

        Driver driver = driverRepository.findById(
                driverId.longValue()
        );

        if (driver == null) {
            throw new WebApplicationException(
                    "Driver not found",
                    Response.Status.NOT_FOUND
            );
        }

        User user = driver.user;

        List<VehicleResponse> vehicles =
                vehicleRepository.findByDriver(driver)
                        .stream()
                        .map(vehicle ->
                                new VehicleResponse(
                                        vehicle.vehicleId,
                                        vehicle.make,
                                        vehicle.model,
                                        vehicle.vehicleYear,
                                        vehicle.color,
                                        vehicle.plateNumber,
                                        vehicle.vehicleType,
                                        vehicle.capacity
                                )
                        )
                        .collect(Collectors.toList());

        return new DriverProfileResponse(
                user.userId,
                user.fullName,
                user.phoneNumber,
                user.email,
                user.role,
                driver.driverId,
                driver.licenseNumber,
                driver.driverStatus != null
                        ? driver.driverStatus.name()
                        : null,
                vehicles
        );
    }

    public List<RideResponse> getTripHistory(
            Integer driverId
    ) {
        Driver driver = driverRepository.findById(
                driverId.longValue()
        );

        if (driver == null) {
            throw new WebApplicationException(
                    "Driver not found",
                    Response.Status.NOT_FOUND
            );
        }

        List<Ride> rides =
                rideRepository.findByDriver(driver);

        List<RideResponse> response =
                new ArrayList<>();

        for (Ride ride : rides) {

            response.add(
                    new RideResponse(
                            ride.rideId,
                            ride.pickupName,
                            ride.dropoffName,
                            ride.acceptedFare != null
                                    ? ride.acceptedFare.doubleValue()
                                    : null,
                            ride.rideStatus.name(),
                            ride.requestedAt != null
                                    ? ride.requestedAt.toString()
                                    : null,
                            ride.startedAt != null
                                    ? ride.startedAt.toString()
                                    : null,
                            ride.completedAt != null
                                    ? ride.completedAt.toString()
                                    : null
                    )
            );
        }

        return response;
    }

    public WalletResponse getWallet(
            Integer driverId
    ) {
        Driver driver = driverRepository.findById(
                driverId.longValue()
        );

        if (driver == null) {
            throw new WebApplicationException(
                    "Driver not found",
                    Response.Status.NOT_FOUND
            );
        }

        Wallet wallet =
                walletRepository.findByDriver(driver);

        if (wallet == null) {
            throw new WebApplicationException(
                    "Wallet not found for this driver",
                    Response.Status.NOT_FOUND
            );
        }

        return new WalletResponse(
                wallet.walletId,
                driver.driverId,
                wallet.balance
        );
    }
}