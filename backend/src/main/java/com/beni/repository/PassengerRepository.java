package com.beni.repository;

import com.beni.entity.Passenger;
import com.beni.entity.User;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PassengerRepository implements PanacheRepository<Passenger> {

    public Passenger findByUser(User user) {
        return find("user", user).firstResult();
    }
}