package com.beni.repository;

import com.beni.entity.Driver;
import com.beni.entity.DriverStatus;
import com.beni.entity.User;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class DriverRepository
        implements PanacheRepository<Driver> {

    public Driver findByUser(User user) {
        if (user == null) {
            return null;
        }

        return find(
                "user",
                user
        ).firstResult();
    }

    public Driver findByLicenseNumberIgnoreCase(
            String licenseNumber
    ) {
        if (licenseNumber == null
                || licenseNumber.isBlank()) {
            return null;
        }

        return find(
                "lower(licenseNumber) = lower(?1)",
                licenseNumber.trim()
        ).firstResult();
    }

    public long countOnlineDrivers() {
        return count("driverStatus", DriverStatus.Online);
    }
}
