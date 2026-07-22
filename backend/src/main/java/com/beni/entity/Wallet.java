package com.beni.entity;

import jakarta.persistence.*;

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

    @Column(name = "balance", nullable = false)
    public Double balance;
}