package com.beni.repository;

import com.beni.entity.AuthSession;
import com.beni.entity.User;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class AuthSessionRepository implements PanacheRepository<AuthSession> {

    public List<AuthSession> findActiveByUser(User user) {
        return list("user = ?1 and revokedAt is null", user);
    }

    public AuthSession findByTokenHash(String tokenHash) {
        return find("tokenHash", tokenHash).firstResult();
    }
}
