
package com.beni.dto;

import java.math.BigDecimal;

public class WalletResponse {

    public Integer walletId;
    public Integer driverId;
    public BigDecimal balance;

    public WalletResponse() {
    }

    public WalletResponse(Integer walletId, Integer driverId, BigDecimal balance) {
        this.walletId = walletId;
        this.driverId = driverId;
        this.balance = balance;
    }
}
