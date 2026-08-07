package com.beni.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class WalletTopUpResponse {

    public Integer topUpRequestId;

    public Integer walletId;

    public Integer driverId;

    public BigDecimal amount;

    public String paymentMethodCode;

    public String paymentMethodName;

    public String referenceNumber;

    public LocalDate paymentDate;

    public String note;

    public String requestStatus;

    public LocalDateTime submittedAt;

    public Integer reviewedByUserId;

    public LocalDateTime reviewedAt;

    public String rejectionReason;

    public Integer transactionId;

    public boolean autoApproved;

    public String message;
}