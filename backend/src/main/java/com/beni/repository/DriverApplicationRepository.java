package com.beni.repository;

import com.beni.entity.DriverApplication;
import com.beni.entity.DriverApplicationStatus;
import com.beni.entity.User;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class DriverApplicationRepository
        implements PanacheRepository<DriverApplication> {

    public DriverApplication findLatestByUser(User user) {
        if (user == null) {
            return null;
        }

        return find(
                "user = ?1 order by attemptNumber desc",
                user
        ).firstResult();
    }

    public DriverApplication findLatestByUserId(Integer userId) {
        if (userId == null) {
            return null;
        }

        return find(
                "user.userId = ?1 order by attemptNumber desc",
                userId
        ).firstResult();
    }

    public DriverApplication findPendingByUserId(Integer userId) {
        if (userId == null) {
            return null;
        }

        return find(
                "user.userId = ?1 and status = ?2",
                userId,
                DriverApplicationStatus.PENDING_REVIEW
        ).firstResult();
    }

    public List<DriverApplication> findReviewQueue() {
        return find(
                "status = ?1 order by submittedAt asc",
                DriverApplicationStatus.PENDING_REVIEW
        ).list();
    }

    public List<DriverApplication> findByStatus(
            DriverApplicationStatus status
    ) {
        return find(
                "status = ?1 order by submittedAt desc",
                status
        ).list();
    }

    public int nextAttemptNumber(User user) {
        DriverApplication latest = findLatestByUser(user);

        if (latest == null || latest.attemptNumber == null) {
            return 1;
        }

        return latest.attemptNumber + 1;
    }

    public boolean activeCnicExistsForAnotherUser(
            String cnicNumber,
            Integer excludedUserId
    ) {
        if (excludedUserId == null) {
            return count(
                    "cnicNumber = ?1 and " +
                            "(status = ?2 or status = ?3)",
                    cnicNumber,
                    DriverApplicationStatus.PENDING_REVIEW,
                    DriverApplicationStatus.APPROVED
            ) > 0;
        }

        return count(
                "cnicNumber = ?1 and " +
                        "(status = ?2 or status = ?3) and " +
                        "user.userId <> ?4",
                cnicNumber,
                DriverApplicationStatus.PENDING_REVIEW,
                DriverApplicationStatus.APPROVED,
                excludedUserId
        ) > 0;
    }

    public boolean activeLicenseExistsForAnotherUser(
            String licenseNumber,
            Integer excludedUserId
    ) {
        if (excludedUserId == null) {
            return count(
                    "lower(licenseNumber) = lower(?1) and " +
                            "(status = ?2 or status = ?3)",
                    licenseNumber,
                    DriverApplicationStatus.PENDING_REVIEW,
                    DriverApplicationStatus.APPROVED
            ) > 0;
        }

        return count(
                "lower(licenseNumber) = lower(?1) and " +
                        "(status = ?2 or status = ?3) and " +
                        "user.userId <> ?4",
                licenseNumber,
                DriverApplicationStatus.PENDING_REVIEW,
                DriverApplicationStatus.APPROVED,
                excludedUserId
        ) > 0;
    }

    public boolean activePlateExistsForAnotherUser(
            String plateNumber,
            Integer excludedUserId
    ) {
        if (excludedUserId == null) {
            return count(
                    "lower(vehiclePlateNumber) = lower(?1) and " +
                            "(status = ?2 or status = ?3)",
                    plateNumber,
                    DriverApplicationStatus.PENDING_REVIEW,
                    DriverApplicationStatus.APPROVED
            ) > 0;
        }

        return count(
                "lower(vehiclePlateNumber) = lower(?1) and " +
                        "(status = ?2 or status = ?3) and " +
                        "user.userId <> ?4",
                plateNumber,
                DriverApplicationStatus.PENDING_REVIEW,
                DriverApplicationStatus.APPROVED,
                excludedUserId
        ) > 0;
    }
}