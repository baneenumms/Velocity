package com.beni.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(
            strategy =
                    GenerationType.IDENTITY
    )
    @Column(name = "transaction_id")
    public Integer transactionId;

    @JsonIgnore
    @ManyToOne(
            fetch = FetchType.LAZY
    )
    @JoinColumn(name = "ride_id")
    public Ride ride;

    @JsonIgnore
    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "wallet_id",
            nullable = false
    )
    public Wallet wallet;

    @Column(
            name = "transaction_type",
            nullable = false,
            length = 30
    )
    public String transactionType;

    /*
     * The database foreign key validates this
     * code against payment_methods.
     *
     * Keeping it as String preserves compatibility
     * with the existing RideService assignments.
     */
    @Column(
            name = "payment_method",
            nullable = false,
            length = 20
    )
    public String paymentMethod;

    @Column(
            name = "direction",
            nullable = false,
            length = 10
    )
    public String direction;

    @Column(
            name = "amount",
            nullable = false,
            precision = 10,
            scale = 2
    )
    public BigDecimal amount;

    @Column(
            name = "transaction_status",
            nullable = false,
            length = 20
    )
    public String transactionStatus;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    public LocalDateTime createdAt;

    @Column(name = "completed_at")
    public LocalDateTime completedAt;

    @PrePersist
    void applyDefaults() {
        if (createdAt == null) {
            createdAt =
                    LocalDateTime.now();
        }
    }
}