package com.beni.repository;

import com.beni.entity.Ride;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class RideRepository implements PanacheRepository<Ride> {

}