package com.beni.service;

import com.beni.entity.User;
import com.beni.entity.UserRole;
import com.beni.repository.UserRoleRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;

@ApplicationScoped
public class UserRoleService {

    @Inject
    UserRoleRepository userRoleRepository;

    public boolean hasRole(User user, String role) {
        return userRoleRepository.hasRole(user, role);
    }

    @Transactional
    public void grantRole(User user, String role) {
        if (user == null || role == null || role.isBlank() || hasRole(user, role)) {
            return;
        }

        UserRole assignment = new UserRole();
        assignment.user = user;
        assignment.role = role.trim().toUpperCase();
        assignment.assignedAt = LocalDateTime.now();
        userRoleRepository.persist(assignment);
    }
}
