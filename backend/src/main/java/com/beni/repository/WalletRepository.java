package com.beni.repository;

import com.beni.entity.Driver;
import com.beni.entity.Wallet;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.LockModeType;

@ApplicationScoped
public class WalletRepository
        implements PanacheRepository<Wallet> {

    public Wallet findByDriver(
            Driver driver
    ) {
        if (driver == null) {
            return null;
        }

        return find(
                "driver",
                driver
        ).firstResult();
    }

    public Wallet findByDriverId(
            Integer driverId
    ) {
        if (driverId == null) {
            return null;
        }

        return find(
                "driver.driverId",
                driverId
        ).firstResult();
    }

    public Wallet findByDriverIdForUpdate(
            Integer driverId
    ) {
        if (driverId == null) {
            return null;
        }

        return find(
                "driver.driverId",
                driverId
        )
                .withLock(
                        LockModeType
                                .PESSIMISTIC_WRITE
                )
                .firstResult();
    }

    public Wallet findByIdForUpdate(
            Integer walletId
    ) {
        if (walletId == null) {
            return null;
        }

        return find(
                "walletId",
                walletId
        )
                .withLock(
                        LockModeType
                                .PESSIMISTIC_WRITE
                )
                .firstResult();
    }
}