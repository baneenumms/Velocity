package com.beni.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
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
    public BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "reserved_balance", nullable = false)
    public BigDecimal reservedBalance = BigDecimal.ZERO;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void updateTime() {
        updatedAt = LocalDateTime.now();
    }
}
