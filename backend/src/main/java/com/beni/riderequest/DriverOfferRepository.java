package com.beni.riderequest;

import com.beni.entity.AuthSession;
import com.beni.entity.Driver;
import com.beni.entity.DriverStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class DriverOfferRepository
        implements PanacheRepositoryBase<
        DriverOffer,
        String> {

    public record OfferIdentity(
            String requestId,
            Integer driverId
    ) {
    }

    public OfferIdentity findIdentity(
            String offerId
    ) {
        if (
                offerId == null ||
                        offerId.isBlank()
        ) {
            return null;
        }

        List<Object[]> rows = getEntityManager()
                .createQuery(
                        "select offer.requestId, offer.driverId " +
                                "from DriverOffer offer " +
                                "where offer.offerId = :offerId",
                        Object[].class
                )
                .setParameter(
                        "offerId",
                        offerId.trim()
                )
                .setMaxResults(1)
                .getResultList();

        if (rows.isEmpty()) {
            return null;
        }

        Object[] row = rows.get(0);

        return new OfferIdentity(
                (String) row[0],
                (Integer) row[1]
        );
    }

    public DriverOffer findByOfferId(
            String offerId
    ) {
        if (
                offerId == null ||
                        offerId.isBlank()
        ) {
            return null;
        }

        return findById(offerId.trim());
    }

    public DriverOffer findByOfferIdForUpdate(
            String offerId
    ) {
        if (
                offerId == null ||
                        offerId.isBlank()
        ) {
            return null;
        }

        return findById(
                offerId.trim(),
                LockModeType.PESSIMISTIC_WRITE
        );
    }

    public DriverOffer findPendingForUpdate(
            String requestId,
            Integer driverId
    ) {
        if (
                requestId == null ||
                        requestId.isBlank() ||
                        driverId == null ||
                        driverId <= 0
        ) {
            return null;
        }

        return find(
                "requestId = ?1 and driverId = ?2 and status = ?3",
                requestId.trim(),
                driverId,
                DriverOfferStatus.PENDING
        )
                .withLock(
                        LockModeType.PESSIMISTIC_WRITE
                )
                .firstResult();
    }

    public List<DriverOffer> listVisibleByRequest(
            String requestId,
            LocalDateTime now
    ) {
        if (
                requestId == null ||
                        requestId.isBlank()
        ) {
            return List.of();
        }

        return getEntityManager()
                .createQuery(
                        "select offer " +
                                "from DriverOffer offer, Driver driver, AuthSession session " +
                                "where offer.driverId = driver.driverId " +
                                "and session.user = driver.user " +
                                "and offer.requestId = :requestId " +
                                "and offer.status = :offerStatus " +
                                "and driver.driverStatus = :driverStatus " +
                                "and session.activeMode = :activeMode " +
                                "and session.revokedAt is null " +
                                "and session.expiresAt > :now " +
                                "order by offer.offeredFare asc",
                        DriverOffer.class
                )
                .setParameter("requestId", requestId.trim())
                .setParameter("offerStatus", DriverOfferStatus.PENDING)
                .setParameter("driverStatus", DriverStatus.Online)
                .setParameter("activeMode", "DRIVER")
                .setParameter("now", now)
                .getResultList();
    }

    public List<DriverOffer> listPendingByDriver(
            Integer driverId,
            LocalDateTime now
    ) {
        if (
                driverId == null ||
                        driverId <= 0
        ) {
            return List.of();
        }

        return getEntityManager()
                .createQuery(
                        "select offer " +
                                "from DriverOffer offer, RideRequest request " +
                                "where offer.requestId = request.requestId " +
                                "and offer.driverId = :driverId " +
                                "and offer.status = :offerStatus " +
                                "and request.status = :requestStatus " +
                                "and request.expiresAt > :now " +
                                "order by offer.updatedAt desc",
                        DriverOffer.class
                )
                .setParameter(
                        "driverId",
                        driverId
                )
                .setParameter(
                        "offerStatus",
                        DriverOfferStatus.PENDING
                )
                .setParameter(
                        "requestStatus",
                        RideRequestStatus.SEARCHING
                )
                .setParameter(
                        "now",
                        now
                )
                .getResultList();
    }

    public List<DriverOffer> listPending() {
        return list(
                "status",
                DriverOfferStatus.PENDING
        );
    }

    public long rejectCompetingOffers(
            String requestId,
            String acceptedOfferId,
            LocalDateTime updatedAt
    ) {
        return update(
                "status = ?1, updatedAt = ?2, " +
                        "version = version + 1 " +
                        "where requestId = ?3 " +
                        "and offerId <> ?4 " +
                        "and status = ?5",
                DriverOfferStatus.REJECTED,
                updatedAt,
                requestId,
                acceptedOfferId,
                DriverOfferStatus.PENDING
        );
    }

    public long withdrawOtherDriverOffers(
            Integer driverId,
            String acceptedOfferId,
            LocalDateTime updatedAt
    ) {
        return update(
                "status = ?1, updatedAt = ?2, " +
                        "version = version + 1 " +
                        "where driverId = ?3 " +
                        "and offerId <> ?4 " +
                        "and status = ?5",
                DriverOfferStatus.WITHDRAWN,
                updatedAt,
                driverId,
                acceptedOfferId,
                DriverOfferStatus.PENDING
        );
    }

    public long withdrawPendingByDriver(
            Integer driverId,
            LocalDateTime updatedAt
    ) {
        return update(
                "status = ?1, updatedAt = ?2, " +
                        "version = version + 1 " +
                        "where driverId = ?3 " +
                        "and status = ?4",
                DriverOfferStatus.WITHDRAWN,
                updatedAt,
                driverId,
                DriverOfferStatus.PENDING
        );
    }

    public long withdrawPendingByRequest(
            String requestId,
            LocalDateTime updatedAt
    ) {
        return update(
                "status = ?1, updatedAt = ?2, " +
                        "version = version + 1 " +
                        "where requestId = ?3 " +
                        "and status = ?4",
                DriverOfferStatus.WITHDRAWN,
                updatedAt,
                requestId,
                DriverOfferStatus.PENDING
        );
    }

    public long withdrawPendingForInactiveRequests(
            LocalDateTime updatedAt
    ) {
        return update(
                "status = ?1, updatedAt = ?2, " +
                        "version = version + 1 " +
                        "where status = ?3 " +
                        "and requestId in (" +
                        "select rideRequest.requestId " +
                        "from RideRequest rideRequest " +
                        "where rideRequest.status <> ?4)",
                DriverOfferStatus.WITHDRAWN,
                updatedAt,
                DriverOfferStatus.PENDING,
                RideRequestStatus.SEARCHING
        );
    }
}
