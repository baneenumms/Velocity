package com.beni.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "driver_application_corrections",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "driver_application_correction_field_unique",
                        columnNames = {"application_id", "field_name"}
                )
        }
)
public class DriverApplicationCorrection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "correction_id")
    public Integer correctionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    public DriverApplication application;

    @Column(name = "field_name", nullable = false, length = 50)
    public String fieldName;

    @Column(name = "instruction", nullable = false, length = 1000)
    public String instruction;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    public User createdBy;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    void beforeInsert() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}