package com.beni.repository;

import com.beni.entity.Driver;
import com.beni.entity.Passenger;
import com.beni.entity.Ride;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class RideRepository implements PanacheRepository<Ride> {

    public List<Ride> findByDriver(Driver driver) {
        return find(
                "driver = ?1 order by requestedAt desc",
                driver
        ).list();
    }

    public List<Ride> findByPassenger(
            Passenger passenger
    ) {
        return find(
                "passenger = ?1 order by requestedAt desc",
                passenger
        ).list();
    }
}