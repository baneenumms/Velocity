package com.beni.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_methods")
public class PaymentMethod {

    @Id
    @Column(
            name = "payment_method_code",
            length = 20
    )
    public String paymentMethodCode;

    @Column(
            name = "display_name",
            nullable = false,
            unique = true,
            length = 50
    )
    public String displayName;

    @Column(
            name = "can_top_up",
            nullable = false
    )
    public Boolean canTopUp = false;

    @Column(
            name = "active",
            nullable = false
    )
    public Boolean active = true;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    public LocalDateTime createdAt;

    @PrePersist
    void applyDefaults() {
        if (canTopUp == null) {
            canTopUp = false;
        }

        if (active == null) {
            active = true;
        }

        if (createdAt == null) {
            createdAt =
                    LocalDateTime.now();
        }
    }
}