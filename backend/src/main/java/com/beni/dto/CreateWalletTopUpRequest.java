package com.beni.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateWalletTopUpRequest {

    public BigDecimal amount;

    public String paymentMethodCode;

    public String referenceNumber;

    public LocalDate paymentDate;

    public String note;
}