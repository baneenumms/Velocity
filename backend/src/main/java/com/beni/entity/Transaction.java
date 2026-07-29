package com.beni.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    public Integer transactionId;

    @ManyToOne
    @JoinColumn(name = "ride_id", nullable = false)
    public Ride ride;

    @ManyToOne
    @JoinColumn(name = "wallet_id")
    public Wallet wallet;

    @Column(name = "transaction_type", nullable = false)
    public String transactionType;

    @Column(name = "payment_method", nullable = false)
    public String paymentMethod;

    @Column(name = "direction")
    public String direction;

    @Column(name = "amount", nullable = false)
    public BigDecimal amount;

    @Column(name = "transaction_status", nullable = false)
    public String transactionStatus = "PENDING";

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "completed_at")
    public LocalDateTime completedAt;

    @PrePersist
    void beforeInsert() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}