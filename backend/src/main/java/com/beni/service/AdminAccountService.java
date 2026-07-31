package com.beni.service;

import com.beni.dto.AccountStatusResponse;
import com.beni.dto.AccountSuspensionRequest;
import com.beni.entity.Driver;
import com.beni.entity.DriverStatus;
import com.beni.entity.User;
import com.beni.repository.DriverRepository;
import com.beni.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

import java.time.LocalDateTime;

@ApplicationScoped
public class AdminAccountService {

    @Inject
    UserRepository userRepository;

    @Inject
    DriverRepository driverRepository;

    @Transactional
    public AccountStatusResponse suspend(
            Integer targetUserId,
            AccountSuspensionRequest request,
            User admin
    ) {
        User target =
                findManageableUser(
                        targetUserId,
                        admin
                );

        String reason =
                request == null ||
                        request.reason == null
                        ? ""
                        : request.reason.trim();

        require(
                !reason.isEmpty(),
                "Suspension reason is required.",
                400
        );

        require(
                reason.length() <= 500,
                "Suspension reason cannot exceed 500 characters.",
                400
        );

        require(
                !"SUSPENDED".equalsIgnoreCase(
                        target.accountStatus
                ),
                "This account is already suspended.",
                409
        );

        LocalDateTime now =
                LocalDateTime.now();

        target.accountStatus =
                "SUSPENDED";

        target.suspensionReason =
                reason;

        target.suspendedAt =
                now;

        target.suspendedBy =
                admin.userId;

        target.reactivatedAt =
                null;

        target.reactivatedBy =
                null;

        Driver driver =
                driverFor(target);

        if (driver != null) {
            driver.driverStatus =
                    DriverStatus.Suspended;
        }

        return response(
                target,
                driver,
                "Account suspended successfully."
        );
    }

    @Transactional
    public AccountStatusResponse reactivate(
            Integer targetUserId,
            User admin
    ) {
        User target =
                findManageableUser(
                        targetUserId,
                        admin
                );

        require(
                "SUSPENDED".equalsIgnoreCase(
                        target.accountStatus
                ),
                "This account is already active.",
                409
        );

        target.accountStatus =
                "ACTIVE";

        target.reactivatedAt =
                LocalDateTime.now();

        target.reactivatedBy =
                admin.userId;

        Driver driver =
                driverFor(target);

        if (driver != null) {
            driver.driverStatus =
                    DriverStatus.Offline;
        }

        return response(
                target,
                driver,
                "Account reactivated successfully."
        );
    }

    private User findManageableUser(
            Integer targetUserId,
            User admin
    ) {
        require(
                targetUserId != null &&
                        targetUserId > 0,
                "Valid user ID is required.",
                400
        );

        require(
                admin != null &&
                        admin.userId != null,
                "Admin access is required.",
                403
        );

        User target =
                userRepository.findById(
                        targetUserId.longValue()
                );

        require(
                target != null,
                "User was not found.",
                404
        );

        require(
                !target.userId.equals(
                        admin.userId
                ),
                "You cannot suspend or reactivate your own account.",
                403
        );

        require(
                !Boolean.TRUE.equals(
                        target.isAdmin
                ),
                "Another admin account cannot be managed here.",
                403
        );

        String role =
                target.role == null
                        ? ""
                        : target.role
                        .trim()
                        .toLowerCase();

        require(
                role.equals("driver") ||
                        role.equals("passenger"),
                "Only driver and passenger accounts can be managed.",
                400
        );

        return target;
    }

    private Driver driverFor(
            User user
    ) {
        if (
                user.role == null ||
                        !user.role.equalsIgnoreCase(
                                "driver"
                        )
        ) {
            return null;
        }

        Driver driver =
                driverRepository.findByUser(
                        user
                );

        require(
                driver != null,
                "Driver record was not found.",
                404
        );

        return driver;
    }

    private AccountStatusResponse response(
            User user,
            Driver driver,
            String message
    ) {
        AccountStatusResponse response =
                new AccountStatusResponse();

        response.success = true;
        response.message = message;

        response.userId =
                user.userId;

        response.role =
                user.role;

        response.accountStatus =
                user.accountStatus;

        if (driver != null) {
            response.driverId =
                    driver.driverId;

            response.driverStatus =
                    driver.driverStatus
                            .name();
        }

        return response;
    }

    private void require(
            boolean condition,
            String message,
            int status
    ) {
        if (!condition) {
            throw new WebApplicationException(
                    message,
                    status
            );
        }
    }
}