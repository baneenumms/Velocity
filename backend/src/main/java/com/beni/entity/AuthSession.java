package com.beni.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "auth_sessions")
public class AuthSession {

    @Id
    @Column(name = "session_id")
    public UUID sessionId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    public User user;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(
            name = "token_hash",
            nullable = false,
            unique = true,
            length = 64
    )
    public String tokenHash;

    @Column(name = "active_mode", nullable = false)
    public String activeMode;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    public LocalDateTime expiresAt;

    @Column(name = "revoked_at")
    public LocalDateTime revokedAt;

    @Column(name = "revoked_reason")
    public String revokedReason;
}
