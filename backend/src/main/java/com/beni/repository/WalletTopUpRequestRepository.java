package com.beni.repository;

import com.beni.entity.WalletTopUpRequest;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.LockModeType;

import java.util.List;

@ApplicationScoped
public class WalletTopUpRequestRepository
        implements PanacheRepository<
        WalletTopUpRequest> {

    public WalletTopUpRequest
    findByReferenceNumber(
            String referenceNumber
    ) {
        if (
                referenceNumber == null ||
                        referenceNumber.isBlank()
        ) {
            return null;
        }

        return find(
                "lower(referenceNumber) = " +
                        "lower(?1)",
                referenceNumber.trim()
        ).firstResult();
    }

    public List<WalletTopUpRequest>
    listByWalletId(
            Integer walletId
    ) {
        if (walletId == null) {
            return List.of();
        }

        return list(
                "wallet.walletId = ?1 " +
                        "order by submittedAt desc",
                walletId
        );
    }

    public List<WalletTopUpRequest>
    listByStatus(
            String status
    ) {
        if (
                status == null ||
                        status.isBlank()
        ) {
            return List.of();
        }

        return list(
                "requestStatus = ?1 " +
                        "order by submittedAt asc",
                status.trim().toUpperCase()
        );
    }

    public WalletTopUpRequest
    findByIdForUpdate(
            Integer requestId
    ) {
        if (requestId == null) {
            return null;
        }

        return find(
                "topUpRequestId",
                requestId
        )
                .withLock(
                        LockModeType
                                .PESSIMISTIC_WRITE
                )
                .firstResult();
    }
}