package com.beni.repository;

import com.beni.entity.User;
import com.beni.entity.UserRole;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserRoleRepository implements PanacheRepository<UserRole> {

    public boolean hasRole(User user, String role) {
        return user != null && role != null &&
                count("user = ?1 and upper(role) = ?2", user, role.toUpperCase()) > 0;
    }

    public UserRole findRole(User user, String role) {
        return find("user = ?1 and upper(role) = ?2", user, role.toUpperCase()).firstResult();
    }
}
