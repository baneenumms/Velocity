package com.beni.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    public Integer userId;

    @Column(name = "full_name", nullable = false)
    public String fullName;

    @Column(name = "phone_number", unique = true, nullable = false)
    public String phoneNumber;

    @Column(name = "email", unique = true)
    public String email;

    @Column(name = "role", nullable = false)
    public String role;
}