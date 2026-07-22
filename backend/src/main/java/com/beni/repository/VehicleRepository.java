package com.beni.repository;

import com.beni.entity.Driver;
import com.beni.entity.Vehicle;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class VehicleRepository implements PanacheRepository<Vehicle> {

    public List<Vehicle> findByDriver(Driver driver) {
        return list("driver", driver);
    }
}