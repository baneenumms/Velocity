package com.beni.repository;

import com.beni.entity.User;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserRepository
        implements PanacheRepository<User> {

    public User findByPhoneNumber(
            String phoneNumber
    ) {
        if (
                phoneNumber == null ||
                        phoneNumber.isBlank()
        ) {
            return null;
        }

        return find(
                "phoneNumber",
                phoneNumber.trim()
        ).firstResult();
    }

    public User findByEmail(
            String email
    ) {
        if (
                email == null ||
                        email.isBlank()
        ) {
            return null;
        }

        return find(
                "lower(email) = lower(?1)",
                email.trim()
        ).firstResult();
    }
}