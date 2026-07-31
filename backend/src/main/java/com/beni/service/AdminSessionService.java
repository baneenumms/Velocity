package com.beni.service;

import com.beni.entity.User;
import com.beni.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class AdminSessionService {

    private static final long
            SESSION_DURATION_HOURS = 4;

    private final ConcurrentHashMap<
            String,
            AdminSession
            > sessions =
            new ConcurrentHashMap<>();

    @Inject
    UserRepository userRepository;

    public String createSession(
            User user
    ) {
        require(
                user != null &&
                        Boolean.TRUE.equals(
                                user.isAdmin
                        ),
                "Admin access is required.",
                403
        );

        require(
                "ACTIVE".equalsIgnoreCase(
                        user.accountStatus
                ),
                "This account is suspended.",
                403
        );

        String token =
                UUID.randomUUID()
                        .toString();

        AdminSession session =
                new AdminSession();

        session.userId =
                user.userId;

        session.expiresAt =
                LocalDateTime.now()
                        .plusHours(
                                SESSION_DURATION_HOURS
                        );

        sessions.put(
                token,
                session
        );

        return token;
    }

    public User requireAdmin(
            String authorizationHeader
    ) {
        String token =
                extractToken(
                        authorizationHeader
                );

        AdminSession session =
                sessions.get(token);

        require(
                session != null,
                "Admin session is invalid.",
                401
        );

        if (
                session.expiresAt == null ||
                        session.expiresAt
                                .isBefore(
                                        LocalDateTime.now()
                                )
        ) {
            sessions.remove(token);

            throw new WebApplicationException(
                    "Admin session has expired.",
                    401
            );
        }

        User user =
                userRepository.findById(
                        session.userId.longValue()
                );

        require(
                user != null,
                "Admin account was not found.",
                401
        );

        require(
                Boolean.TRUE.equals(
                        user.isAdmin
                ),
                "Admin access is required.",
                403
        );

        require(
                "ACTIVE".equalsIgnoreCase(
                        user.accountStatus
                ),
                "This account is suspended.",
                403
        );

        return user;
    }

    public void revokeSession(
            String authorizationHeader
    ) {
        String token =
                extractToken(
                        authorizationHeader
                );

        sessions.remove(token);
    }

    private String extractToken(
            String authorizationHeader
    ) {
        require(
                authorizationHeader != null &&
                        authorizationHeader
                                .startsWith(
                                        "Bearer "
                                ),
                "Admin authorization is required.",
                401
        );

        String token =
                authorizationHeader
                        .substring(7)
                        .trim();

        require(
                !token.isEmpty(),
                "Admin authorization is required.",
                401
        );

        return token;
    }

    private void require(
            boolean condition,
            String message,
            int status
    ) {
        if (!condition) {
            throw new WebApplicationException(
                    message,
                    status
            );
        }
    }

    private static class AdminSession {

        Integer userId;
        LocalDateTime expiresAt;
    }
}