package com.beni.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class AdminWalletTopUpResponse {

    public Integer topUpRequestId;

    public Integer walletId;

    public Integer driverId;

    public Integer userId;

    public String driverName;

    public String phoneNumber;

    public String email;

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

    public BigDecimal currentBalance;

    public BigDecimal reservedBalance;

    public BigDecimal availableBalance;

    public String message;
}