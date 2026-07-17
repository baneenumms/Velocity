package com.beni.repository;

import com.beni.entity.DriverAuth;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class DriverAuthRepository implements PanacheRepository<DriverAuth> {
}