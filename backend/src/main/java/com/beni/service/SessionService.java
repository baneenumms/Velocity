package com.beni.service;

import com.beni.dto.SessionResponse;
import com.beni.entity.AuthSession;
import com.beni.entity.DriverStatus;
import com.beni.entity.User;
import com.beni.repository.AuthSessionRepository;
import com.beni.repository.DriverRepository;
import com.beni.repository.PassengerRepository;
import com.beni.riderequest.DriverOfferRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@ApplicationScoped
public class SessionService {

    private static final int SESSION_HOURS = 8;

    private final SecureRandom random = new SecureRandom();

    @Inject
    AuthSessionRepository authSessionRepository;

    @Inject
    UserRoleService userRoleService;

    @Inject
    PassengerRepository passengerRepository;

    @Inject
    DriverRepository driverRepository;

    @Inject
    ActiveRidePolicyService activeRidePolicyService;

    @Inject
    DriverOfferRepository driverOfferRepository;

    @Transactional
    public SessionResponse replaceSession(User user, String activeMode) {
        if (user == null || activeMode == null || activeMode.isBlank()) {
            throw unauthorized("INVALID_SESSION", "A valid user session is required.");
        }

        String normalizedMode = activeMode.trim().toUpperCase();
        if (!userRoleService.hasRole(user, normalizedMode)) {
            throw new WebApplicationException("This account cannot use " + normalizedMode + " mode.", 403);
        }

        LocalDateTime now = LocalDateTime.now();
        var activeSessions = authSessionRepository.findActiveByUser(user);

        boolean changingMode = activeSessions.stream()
                .anyMatch(session -> !session.activeMode.equalsIgnoreCase(normalizedMode));

        if (changingMode) {
            requireNoActiveRideBeforeModeSwitch(user);
            setDriverOfflineWhenLeavingDriverMode(activeSessions, user, normalizedMode);
        }

        activeSessions.forEach(session -> {
            session.revokedAt = now;
            session.revokedReason = "REPLACED_BY_NEW_LOGIN";
        });
        // PostgreSQL enforces one active session per user. Flush the revocation
        // before inserting the replacement, otherwise Hibernate may attempt
        // the INSERT first and violate the partial unique index.
        authSessionRepository.flush();

        String rawToken = newToken();
        AuthSession session = new AuthSession();
        session.sessionId = UUID.randomUUID();
        session.user = user;
        session.tokenHash = hash(rawToken);
        session.activeMode = normalizedMode;
        session.createdAt = now;
        session.expiresAt = now.plusHours(SESSION_HOURS);
        authSessionRepository.persist(session);

        SessionResponse response = new SessionResponse();
        response.sessionToken = rawToken;
        response.activeMode = normalizedMode;
        response.expiresAt = session.expiresAt.toString();
        return response;
    }

    public AuthSession requireValidSession(String authorizationHeader) {
        String token = bearerToken(authorizationHeader);
        AuthSession session = authSessionRepository.findByTokenHash(hash(token));

        if (session == null) {
            throw unauthorized("INVALID_SESSION", "Your session is not valid. Please sign in again.");
        }

        if (session.revokedAt != null) {
            throw unauthorized("SESSION_REPLACED", "You were signed out because this account was opened elsewhere.");
        }

        if (!session.expiresAt.isAfter(LocalDateTime.now())) {
            throw unauthorized("SESSION_EXPIRED", "Your session has expired. Please sign in again.");
        }

        return session;
    }

    public AuthSession requireMode(String authorizationHeader, String mode) {
        AuthSession session = requireValidSession(authorizationHeader);
        if (!session.activeMode.equalsIgnoreCase(mode)) {
            throw new WebApplicationException("This action requires " + mode + " mode.", 403);
        }
        return session;
    }

    @Transactional
    public void revokeCurrentSession(String authorizationHeader) {
        AuthSession session = requireValidSession(authorizationHeader);
        LocalDateTime now = LocalDateTime.now();

        /*
         * Logging out must make a driver unavailable immediately.
         * Pending offers cannot remain visible or be accepted after
         * the driver leaves the app.
         */
        if (session.activeMode.equalsIgnoreCase("DRIVER")) {
            var driver = driverRepository.findByUser(session.user);

            if (driver != null) {
                if (activeRidePolicyService.driverHasActiveRide(driver.driverId)) {
                    throw new WebApplicationException(
                            "You have an active ride. Complete it or cancel it before logging out.",
                            409
                    );
                }

                driver.driverStatus = DriverStatus.Offline;

                driverOfferRepository.withdrawPendingByDriver(
                        driver.driverId,
                        now
                );
            }
        }

        session.revokedAt = now;
        session.revokedReason = "SIGNED_OUT";
    }

    private String bearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw unauthorized("INVALID_SESSION", "Please sign in again.");
        }

        String token = authorizationHeader.substring("Bearer ".length()).trim();
        if (token.isBlank()) {
            throw unauthorized("INVALID_SESSION", "Please sign in again.");
        }
        return token;
    }

    private void requireNoActiveRideBeforeModeSwitch(User user) {
        var passenger = passengerRepository.findByUser(user);
        if (passenger != null && activeRidePolicyService.passengerHasActiveRide(passenger.passengerId)) {
            throw new WebApplicationException(
                    "Complete or cancel your passenger ride before switching to another mode.",
                    409
            );
        }

        var driver = driverRepository.findByUser(user);
        if (driver != null && activeRidePolicyService.driverHasActiveRide(driver.driverId)) {
            throw new WebApplicationException(
                    "Complete or cancel your driver ride before switching to another mode.",
                    409
            );
        }
    }

    private void setDriverOfflineWhenLeavingDriverMode(
            java.util.List<AuthSession> activeSessions,
            User user,
            String newMode
    ) {
        boolean wasDriverMode = activeSessions.stream()
                .anyMatch(session -> session.activeMode.equalsIgnoreCase("DRIVER"));

        if (wasDriverMode && !"DRIVER".equalsIgnoreCase(newMode)) {
            var driver = driverRepository.findByUser(user);
            if (driver != null) {
                driver.driverStatus = DriverStatus.Offline;
            }
        }
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to secure session token", exception);
        }
    }

    private WebApplicationException unauthorized(String code, String message) {
        return new WebApplicationException(Response.status(Response.Status.UNAUTHORIZED)
                .entity(new SessionError(code, message))
                .build());
    }

    public record SessionError(String code, String message) {
    }
}
