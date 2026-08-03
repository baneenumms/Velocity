package com.beni.service;

import com.beni.entity.DriverApplication;
import com.beni.entity.User;
import com.beni.repository.DriverApplicationRepository;
import com.beni.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class DriverApplicantSessionService {

    private static final int SESSION_HOURS = 4;

    private final Map<String, ApplicantSession> sessions =
            new ConcurrentHashMap<>();

    @Inject
    UserRepository userRepository;

    @Inject
    DriverApplicationRepository applicationRepository;

    public String createSession(User user) {
        if (user == null || user.userId == null) {
            throw new WebApplicationException(
                    "Applicant account not found",
                    404
            );
        }

        DriverApplication application =
                applicationRepository.findLatestByUser(user);

        if (application == null) {
            throw new WebApplicationException(
                    "Driver application not found",
                    404
            );
        }

        removeExpiredSessions();

        String token = UUID.randomUUID().toString();

        ApplicantSession session = new ApplicantSession();
        session.userId = user.userId;
        session.expiresAt = LocalDateTime.now()
                .plusHours(SESSION_HOURS);

        sessions.put(token, session);

        return token;
    }

    public User requireApplicant(String authorizationHeader) {
        String token = readBearerToken(authorizationHeader);

        ApplicantSession session = sessions.get(token);

        if (session == null) {
            throw new WebApplicationException(
                    "Applicant session is invalid or expired",
                    401
            );
        }

        if (session.expiresAt.isBefore(LocalDateTime.now())) {
            sessions.remove(token);

            throw new WebApplicationException(
                    "Applicant session has expired",
                    401
            );
        }

        User user = userRepository.findById(
                session.userId.longValue()
        );

        if (user == null) {
            sessions.remove(token);

            throw new WebApplicationException(
                    "Applicant account no longer exists",
                    401
            );
        }

        if ("SUSPENDED".equalsIgnoreCase(user.accountStatus)) {
            throw new WebApplicationException(
                    "This account is suspended",
                    403
            );
        }

        DriverApplication application =
                applicationRepository.findLatestByUser(user);

        if (application == null) {
            sessions.remove(token);

            throw new WebApplicationException(
                    "Driver application access is unavailable",
                    403
            );
        }

        return user;
    }

    public void revokeSession(String authorizationHeader) {
        String token = readBearerToken(authorizationHeader);
        sessions.remove(token);
    }

    private String readBearerToken(String authorizationHeader) {
        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {
            throw new WebApplicationException(
                    "Applicant authorization is required",
                    401
            );
        }

        String token = authorizationHeader
                .substring("Bearer ".length())
                .trim();

        if (token.isBlank()) {
            throw new WebApplicationException(
                    "Applicant authorization is required",
                    401
            );
        }

        return token;
    }

    private void removeExpiredSessions() {
        LocalDateTime now = LocalDateTime.now();

        sessions.entrySet().removeIf(
                entry -> entry.getValue().expiresAt.isBefore(now)
        );
    }

    private static class ApplicantSession {
        Integer userId;
        LocalDateTime expiresAt;
    }
}