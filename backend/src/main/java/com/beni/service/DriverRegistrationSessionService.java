package com.beni.service;

import com.beni.dto.DriverSignupRequest;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class DriverRegistrationSessionService {

    private static final int SESSION_MINUTES = 15;

    private final Map<String, PendingDriverSignup> sessions =
            new ConcurrentHashMap<>();

    public String createSession(
            DriverSignupRequest request,
            String passwordHash
    ) {
        return createSession(
                request,
                passwordHash,
                null
        );
    }

    public String createSession(
            DriverSignupRequest request,
            String passwordHash,
            Integer existingUserId
    ) {
        removeExpiredSessions();

        String token = UUID.randomUUID().toString();

        PendingDriverSignup pending =
                new PendingDriverSignup();

        pending.existingUserId = existingUserId;

        pending.fullName = request.fullName;
        pending.phoneNumber = request.phoneNumber;
        pending.email = request.email;
        pending.cnicNumber = request.cnicNumber;
        pending.licenseNumber = request.licenseNumber;

        pending.vehicleMake = request.vehicleMake;
        pending.vehicleModel = request.vehicleModel;
        pending.vehicleYear = request.vehicleYear;
        pending.vehicleColor = request.vehicleColor;
        pending.vehiclePlateNumber =
                request.vehiclePlateNumber;
        pending.vehicleCapacity = request.vehicleCapacity;

        pending.passwordHash = passwordHash;
        pending.expiresAt = LocalDateTime.now()
                .plusMinutes(SESSION_MINUTES);

        sessions.put(token, pending);

        return token;
    }

    public PendingDriverSignup getSession(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }

        PendingDriverSignup pending = sessions.get(token);

        if (pending == null) {
            return null;
        }

        if (pending.expiresAt.isBefore(LocalDateTime.now())) {
            sessions.remove(token);
            return null;
        }

        return pending;
    }

    public void removeSession(String token) {
        if (token != null) {
            sessions.remove(token);
        }
    }

    private void removeExpiredSessions() {
        LocalDateTime now = LocalDateTime.now();

        sessions.entrySet().removeIf(
                entry -> entry.getValue().expiresAt.isBefore(now)
        );
    }

    public static class PendingDriverSignup {

        public Integer existingUserId;

        public String fullName;
        public String phoneNumber;
        public String email;
        public String cnicNumber;

        public String licenseNumber;

        public String vehicleMake;
        public String vehicleModel;
        public Integer vehicleYear;
        public String vehicleColor;
        public String vehiclePlateNumber;
        public Integer vehicleCapacity;

        public String passwordHash;
        public LocalDateTime expiresAt;
    }
}