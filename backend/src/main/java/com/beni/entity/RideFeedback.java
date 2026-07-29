package com.beni.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "ride_feedback",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"ride_id", "submitted_by"}
        )
)
public class RideFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "feedback_id")
    public Integer feedbackId;

    @ManyToOne
    @JoinColumn(name = "ride_id", nullable = false)
    public Ride ride;

    @Column(name = "submitted_by", nullable = false)
    public String submittedBy;

    public Integer rating;

    @Column(length = 500)
    public String comment;

    @Column(name = "report_category")
    public String reportCategory;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    void beforeInsert() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}