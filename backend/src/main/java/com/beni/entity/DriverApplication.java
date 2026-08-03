package com.beni.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "driver_applications")
public class DriverApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "application_id")
    public Integer applicationId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    public User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_application_id")
    public DriverApplication previousApplication;

    @Column(name = "attempt_number", nullable = false)
    public Integer attemptNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    public DriverApplicationStatus status =
            DriverApplicationStatus.PENDING_REVIEW;

    @Column(name = "full_name", nullable = false, length = 100)
    public String fullName;

    @Column(name = "phone_number", nullable = false, length = 15)
    public String phoneNumber;

    @Column(name = "email", nullable = false, length = 100)
    public String email;

    @Column(name = "cnic_number", nullable = false, length = 13)
    public String cnicNumber;

    @Column(name = "license_number", nullable = false, length = 50)
    public String licenseNumber;

    @Column(name = "vehicle_make", nullable = false, length = 50)
    public String vehicleMake;

    @Column(name = "vehicle_model", nullable = false, length = 50)
    public String vehicleModel;

    @Column(name = "vehicle_year", nullable = false)
    public Integer vehicleYear;

    @Column(name = "vehicle_color", nullable = false, length = 30)
    public String vehicleColor;

    @Column(name = "vehicle_plate_number", nullable = false, length = 20)
    public String vehiclePlateNumber;

    @Column(name = "vehicle_capacity", nullable = false)
    public Integer vehicleCapacity = 4;

    @Column(name = "submitted_at", nullable = false)
    public LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    public LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    public User reviewedBy;

    @Column(name = "review_summary", length = 1000)
    public String reviewSummary;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_driver_id", unique = true)
    public Driver approvedDriver;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    void beforeInsert() {
        LocalDateTime now = LocalDateTime.now();

        if (status == null) {
            status = DriverApplicationStatus.PENDING_REVIEW;
        }

        if (submittedAt == null) {
            submittedAt = now;
        }

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    void beforeUpdate() {
        updatedAt = LocalDateTime.now();
    }
}