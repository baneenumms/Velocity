package com.beni.service;

import com.beni.dto.DriverRequest;
import com.beni.entity.Driver;
import com.beni.entity.User;
import com.beni.repository.DriverRepository;
import com.beni.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import java.util.List;

@ApplicationScoped
public class DriverService {

    @Inject
    DriverRepository driverRepository;

    @Inject
    UserRepository userRepository;

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
        driver.driverStatus = "Offline";

        driverRepository.persist(driver);

        return driver;
    }

    public List<Driver> getAllDrivers() {
        return driverRepository.listAll();
    }
}