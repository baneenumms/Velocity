package com.beni.riderequest;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class RideRequestRepository
        implements PanacheRepositoryBase<
        RideRequest,
        String> {

    public RideRequest findByRequestId(
            String requestId
    ) {
        if (
                requestId == null ||
                        requestId.isBlank()
        ) {
            return null;
        }

        return findById(requestId.trim());
    }

    public RideRequest findByRequestIdForUpdate(
            String requestId
    ) {
        if (
                requestId == null ||
                        requestId.isBlank()
        ) {
            return null;
        }

        return findById(
                requestId.trim(),
                LockModeType.PESSIMISTIC_WRITE
        );
    }

    public RideRequest findSearchingByPassenger(
            Integer passengerId
    ) {
        if (
                passengerId == null ||
                        passengerId <= 0
        ) {
            return null;
        }

        return find(
                "passengerId = ?1 and status = ?2 " +
                        "order by coalesce(fareUpdatedAt, createdAt) desc",
                passengerId,
                RideRequestStatus.SEARCHING
        ).firstResult();
    }

    public List<RideRequest> listSearching() {
        return list(
                "status = ?1 " +
                        "order by coalesce(fareUpdatedAt, createdAt) desc",
                RideRequestStatus.SEARCHING
        );
    }

    public long expireSearching(
            LocalDateTime now
    ) {
        if (now == null) {
            return 0;
        }

        return update(
                "status = ?1, version = version + 1 " +
                        "where status = ?2 " +
                        "and expiresAt is not null " +
                        "and expiresAt <= ?3",
                RideRequestStatus.EXPIRED,
                RideRequestStatus.SEARCHING,
                now
        );
    }
}
