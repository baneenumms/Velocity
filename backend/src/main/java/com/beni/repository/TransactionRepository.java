package com.beni.repository;

import com.beni.entity.Transaction;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class TransactionRepository
        implements PanacheRepository<Transaction> {

    public Transaction findByRideAndType(
            Integer rideId,
            String type
    ) {
        if (
                rideId == null ||
                        type == null ||
                        type.isBlank()
        ) {
            return null;
        }

        return find(
                "ride.rideId = ?1 " +
                        "and transactionType = ?2",
                rideId,
                type.trim()
        ).firstResult();
    }

    public List<Transaction> listByWalletId(
            Integer walletId
    ) {
        if (walletId == null) {
            return List.of();
        }

        return list(
                "wallet.walletId = ?1 " +
                        "order by createdAt desc",
                walletId
        );
    }

    public List<Transaction> listByWalletAndType(
            Integer walletId,
            String transactionType
    ) {
        if (
                walletId == null ||
                        transactionType == null ||
                        transactionType.isBlank()
        ) {
            return List.of();
        }

        return list(
                "wallet.walletId = ?1 " +
                        "and transactionType = ?2 " +
                        "order by createdAt desc",
                walletId,
                transactionType.trim()
        );
    }
}