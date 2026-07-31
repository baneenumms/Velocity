package com.beni.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(
            strategy =
                    GenerationType.IDENTITY
    )
    @Column(name = "user_id")
    public Integer userId;

    @Column(
            name = "full_name",
            nullable = false
    )
    public String fullName;

    @Column(
            name = "phone_number",
            unique = true,
            nullable = false
    )
    public String phoneNumber;

    @Column(
            name = "email",
            unique = true
    )
    public String email;

    @Column(
            name = "role",
            nullable = false
    )
    public String role;

    /*
     * A driver may also have admin authority
     * without changing their driver role.
     */
    @JsonIgnore
    @Column(
            name = "is_admin",
            nullable = false
    )
    public Boolean isAdmin = false;

    @JsonIgnore
    @Column(
            name = "account_status",
            nullable = false
    )
    public String accountStatus =
            "ACTIVE";

    @JsonIgnore
    @Column(
            name = "suspension_reason",
            length = 500
    )
    public String suspensionReason;

    @JsonIgnore
    @Column(name = "suspended_at")
    public LocalDateTime suspendedAt;

    @JsonIgnore
    @Column(name = "suspended_by")
    public Integer suspendedBy;

    @JsonIgnore
    @Column(name = "reactivated_at")
    public LocalDateTime reactivatedAt;

    @JsonIgnore
    @Column(name = "reactivated_by")
    public Integer reactivatedBy;

    @PrePersist
    void applyAccountDefaults() {
        if (isAdmin == null) {
            isAdmin = false;
        }

        if (
                accountStatus == null ||
                        accountStatus.isBlank()
        ) {
            accountStatus =
                    "ACTIVE";
        }
    }
}