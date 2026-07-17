package com.beni.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "driver_auth")
public class DriverAuth {

    @Id
    @OneToOne
    @JoinColumn(name = "user_id")
    public User user;

    @Column(name = "password_hash", nullable = false)
    public String passwordHash;
}
