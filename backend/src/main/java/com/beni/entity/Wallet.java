package com.beni.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "wallet_id")
    public Integer walletId;

    @OneToOne
    @JoinColumn(name = "driver_id", nullable = false, unique = true)
    public Driver driver;

    @Column(nullable = false)
    public Double balance = 0.0;

    @Column(name = "reserved_balance", nullable = false)
    public Double reservedBalance = 0.0;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void updateTime() {
        updatedAt = LocalDateTime.now();
    }
}