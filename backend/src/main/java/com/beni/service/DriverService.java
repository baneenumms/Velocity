package com.beni.service;

import com.beni.dto.DriverProfileResponse;
import com.beni.dto.DriverRequest;
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

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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

    @Transactional
    public Driver createDriver(DriverRequest request) {

        User user = userRepository.findById(request.userId.longValue());

        if (user == null) {
            throw new WebApplicationException("User not found", 404);
        }

        if (!user.role.equalsIgnoreCase("driver")) {
            throw new WebApplicationException("User is not a driver", 400);
        }

        Driver driver = new Driver();
        driver.user = user;
        driver.licenseNumber = request.licenseNumber;
        driver.driverStatus = DriverStatus.Offline;

        driverRepository.persist(driver);

        return driver;
    }

    public List<Driver> getAllDrivers() {
        return driverRepository.listAll();
    }

    @Transactional
    public DriverStatusResponse updateDriverStatus(Integer driverId, String newStatus) {
        if (!"Online".equals(newStatus) && !"Offline".equals(newStatus)) {
            throw new WebApplicationException(
                    "Invalid status. Only 'Online' or 'Offline' are allowed.",
                    Response.Status.BAD_REQUEST
            );
        }

        Driver driver = driverRepository.findById(driverId.longValue());
        if (driver == null) {
            throw new WebApplicationException("Driver not found", 404);
        }

        DriverStatus statusEnum = DriverStatus.valueOf(newStatus);
        driver.driverStatus = statusEnum;

        return new DriverStatusResponse(
                driver.driverId,
                driver.user.userId,
                driver.driverStatus.name()
        );
    }

    public Driver getDriverByUserId(Integer userId) {
        User user = userRepository.findById(userId.longValue());
        if (user == null) {
            throw new WebApplicationException("User not found", 404);
        }

        Driver driver = driverRepository.findByUser(user);
        if (driver == null) {
            throw new WebApplicationException("Driver not found for given user.", 404);
        }

        return driver;
    }

    public DriverProfileResponse getDriverProfile(Integer driverId) {
        Driver driver = driverRepository.findById(driverId.longValue());

        if (driver == null) {
            throw new WebApplicationException("Driver not found", 404);
        }

        User user = driver.user;

        List<VehicleResponse> vehicles = vehicleRepository.findByDriver(driver)
                .stream()
                .map(vehicle -> new VehicleResponse(
                        vehicle.vehicleId,
                        vehicle.make,
                        vehicle.model,
                        vehicle.vehicleYear,
                        vehicle.color,
                        vehicle.plateNumber,
                        vehicle.vehicleType,
                        vehicle.capacity
                ))
                .collect(Collectors.toList());

        return new DriverProfileResponse(
                user.userId,
                user.fullName,
                user.phoneNumber,
                user.email,
                user.role,
                driver.driverId,
                driver.licenseNumber,
                driver.driverStatus != null ? driver.driverStatus.name() : null,
                vehicles
        );
    }

    public List<RideResponse> getTripHistory(Integer driverId) {
        Driver driver = driverRepository.findById(driverId.longValue());

        if (driver == null) {
            throw new WebApplicationException("Driver not found", 404);
        }

        return new ArrayList<>();
    }

    public WalletResponse getWallet(Integer driverId) {
        Driver driver = driverRepository.findById(driverId.longValue());

        if (driver == null) {
            throw new WebApplicationException("Driver not found", 404);
        }

        Wallet wallet = walletRepository.findByDriver(driver);

        if (wallet == null) {
            throw new WebApplicationException("Wallet not found for this driver", 404);
        }

        return new WalletResponse(
                wallet.walletId,
                driver.driverId,
                wallet.balance
        );
    }
}