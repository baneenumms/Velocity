package com.beni.repository;

import com.beni.entity.Driver;
import com.beni.entity.Passenger;
import com.beni.entity.Ride;
import com.beni.entity.RideStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class RideRepository
        implements PanacheRepository<Ride> {

    public List<Ride> findByDriver(
            Driver driver
    ) {
        return find(
                "driver = ?1 " +
                        "order by requestedAt desc",
                driver
        ).list();
    }

    public List<Ride> findByPassenger(
            Passenger passenger
    ) {
        return find(
                "passenger = ?1 " +
                        "order by requestedAt desc",
                passenger
        ).list();
    }

    /*
     * ACCEPTED and IN_PROGRESS are the
     * only persisted active ride statuses.
     */
    public Ride findActiveByPassengerId(
            Integer passengerId
    ) {
        if (
                passengerId == null ||
                        passengerId <= 0
        ) {
            return null;
        }

        return find(
                "passenger.passengerId = ?1 " +
                        "and " +
                        "(rideStatus = ?2 " +
                        "or rideStatus = ?3) " +
                        "order by acceptedAt desc",
                passengerId,
                RideStatus.ACCEPTED,
                RideStatus.IN_PROGRESS
        ).firstResult();
    }

    public Ride findActiveByDriverId(
            Integer driverId
    ) {
        if (
                driverId == null ||
                        driverId <= 0
        ) {
            return null;
        }

        return find(
                "driver.driverId = ?1 " +
                        "and " +
                        "(rideStatus = ?2 " +
                        "or rideStatus = ?3) " +
                        "order by acceptedAt desc",
                driverId,
                RideStatus.ACCEPTED,
                RideStatus.IN_PROGRESS
        ).firstResult();
    }

    public boolean passengerHasActiveRide(
            Integer passengerId
    ) {
        return findActiveByPassengerId(
                passengerId
        ) != null;
    }

    public boolean driverHasActiveRide(
            Integer driverId
    ) {
        return findActiveByDriverId(
                driverId
        ) != null;
    }
}