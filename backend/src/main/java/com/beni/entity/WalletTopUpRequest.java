package com.beni.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallet_top_up_requests")
public class WalletTopUpRequest {

    @Id
    @GeneratedValue(
            strategy =
                    GenerationType.IDENTITY
    )
    @Column(name = "top_up_request_id")
    public Integer topUpRequestId;

    @JsonIgnore
    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "wallet_id",
            nullable = false
    )
    public Wallet wallet;

    @Column(
            name = "amount",
            nullable = false,
            precision = 10,
            scale = 2
    )
    public BigDecimal amount;

    @ManyToOne(
            fetch = FetchType.EAGER,
            optional = false
    )
    @JoinColumn(
            name = "payment_method_code",
            referencedColumnName =
                    "payment_method_code",
            nullable = false
    )
    public PaymentMethod paymentMethod;

    @Column(
            name = "reference_number",
            nullable = false,
            length = 100
    )
    public String referenceNumber;

    @Column(
            name = "payment_date",
            nullable = false
    )
    public LocalDate paymentDate;

    @Column(
            name = "note",
            length = 500
    )
    public String note;

    @Column(
            name = "request_status",
            nullable = false,
            length = 20
    )
    public String requestStatus =
            "PENDING";

    @Column(
            name = "submitted_at",
            nullable = false,
            updatable = false
    )
    public LocalDateTime submittedAt;

    @JsonIgnore
    @ManyToOne(
            fetch = FetchType.LAZY
    )
    @JoinColumn(name = "reviewed_by")
    public User reviewedBy;

    @Column(name = "reviewed_at")
    public LocalDateTime reviewedAt;

    @Column(
            name = "rejection_reason",
            length = 500
    )
    public String rejectionReason;

    @JsonIgnore
    @OneToOne(
            fetch = FetchType.LAZY
    )
    @JoinColumn(
            name = "transaction_id",
            unique = true
    )
    public Transaction transaction;

    @Column(
            name = "updated_at",
            nullable = false
    )
    public LocalDateTime updatedAt;

    @PrePersist
    void applyDefaults() {
        if (
                requestStatus == null ||
                        requestStatus.isBlank()
        ) {
            requestStatus =
                    "PENDING";
        }

        if (submittedAt == null) {
            submittedAt =
                    LocalDateTime.now();
        }

        updatedAt =
                LocalDateTime.now();
    }

    @PreUpdate
    void updateTimestamp() {
        updatedAt =
                LocalDateTime.now();
    }
}