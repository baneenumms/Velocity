
package com.beni.dto;

public class WalletResponse {

    public Integer walletId;
    public Integer driverId;
    public Double balance;

    public WalletResponse() {
    }

    public WalletResponse(Integer walletId, Integer driverId, Double balance) {
        this.walletId = walletId;
        this.driverId = driverId;
        this.balance = balance;
    }
}