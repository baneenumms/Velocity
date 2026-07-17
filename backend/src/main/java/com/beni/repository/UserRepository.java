package com.beni.repository;

import com.beni.entity.User;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserRepository implements PanacheRepository<User> {

    public User findByPhoneNumber(String phoneNumber) {
        return find("phoneNumber", phoneNumber).firstResult();
    }

}