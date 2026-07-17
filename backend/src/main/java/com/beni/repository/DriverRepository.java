package com.beni.repository;

import com.beni.entity.Driver;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import com.beni.entity.User;

@ApplicationScoped
public class DriverRepository implements PanacheRepository<Driver> {
    public Driver findByUser(User user) {
        return find("user", user).firstResult();
    }
}