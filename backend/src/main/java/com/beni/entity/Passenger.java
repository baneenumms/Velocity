package com.beni.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "passengers")
public class Passenger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "passenger_id")
    public Integer passengerId;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    public User user;
}