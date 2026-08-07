package com.beni.dto;

import java.math.BigDecimal;

public class DriverWalletSummaryResponse {

    public Integer walletId;

    public Integer driverId;

    public BigDecimal balance;

    public BigDecimal reservedBalance;

    public BigDecimal availableBalance;
}