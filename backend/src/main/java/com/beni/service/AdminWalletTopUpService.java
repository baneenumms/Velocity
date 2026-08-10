package com.beni.service;

import com.beni.dto.AdminRejectWalletTopUpRequest;
import com.beni.dto.AdminWalletTopUpResponse;
import com.beni.entity.Transaction;
import com.beni.entity.User;
import com.beni.entity.Wallet;
import com.beni.entity.WalletTopUpRequest;
import com.beni.repository.TransactionRepository;
import com.beni.repository.WalletRepository;
import com.beni.repository.WalletTopUpRequestRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class AdminWalletTopUpService {

    @Inject
    WalletTopUpRequestRepository
            topUpRequestRepository;

    @Inject
    WalletRepository walletRepository;

    @Inject
    TransactionRepository
            transactionRepository;

    @Transactional
    public List<AdminWalletTopUpResponse>
    listRequests(
            String requestedStatus,
            User admin
    ) {
        requireAdmin(admin);

        String status =
                normalizeStatus(
                        requestedStatus
                );

        List<WalletTopUpRequest> requests;

        if ("ALL".equals(status)) {
            requests =
                    topUpRequestRepository
                            .listAll();
        } else {
            requests =
                    topUpRequestRepository
                            .find(
                                    "requestStatus",
                                    status
                            )
                            .list();
        }

        requests.sort(
                Comparator.comparing(
                        (
                                WalletTopUpRequest
                                        request
                        ) ->
                                request.submittedAt,
                        Comparator.nullsLast(
                                Comparator.reverseOrder()
                        )
                )
        );

        return requests
                .stream()
                .map(request ->
                        toResponse(
                                request,
                                null
                        )
                )
                .toList();
    }

    @Transactional
    public AdminWalletTopUpResponse
    getRequest(
            Integer topUpRequestId,
            User admin
    ) {
        requireAdmin(admin);

        WalletTopUpRequest request =
                findRequest(
                        topUpRequestId
                );

        return toResponse(
                request,
                null
        );
    }

    @Transactional
    public AdminWalletTopUpResponse
    approve(
            Integer topUpRequestId,
            User admin
    ) {
        requireAdmin(admin);

        if (topUpRequestId == null) {
            throw new BadRequestException(
                    "Top-up request ID is required."
            );
        }

        WalletTopUpRequest request =
                topUpRequestRepository
                        .findByIdForUpdate(
                                topUpRequestId
                        );

        if (request == null) {
            throw new NotFoundException(
                    "Top-up request was not found."
            );
        }

        requirePending(request);

        if (
                request.wallet == null ||
                        request.wallet.walletId == null
        ) {
            throw new NotFoundException(
                    "The wallet connected to this request was not found."
            );
        }

        Wallet wallet =
                walletRepository
                        .findByIdForUpdate(
                                request.wallet.walletId
                        );

        if (wallet == null) {
            throw new NotFoundException(
                    "Driver wallet was not found."
            );
        }

        if (
                request.amount == null ||
                        request.amount.compareTo(
                                BigDecimal.ZERO
                        ) <= 0
        ) {
            throw new BadRequestException(
                    "The top-up amount is invalid."
            );
        }

        if (
                request.paymentMethod == null ||
                        request.paymentMethod
                                .paymentMethodCode == null
        ) {
            throw new BadRequestException(
                    "The payment method is missing."
            );
        }

        LocalDateTime now =
                LocalDateTime.now();

        Transaction transaction =
                new Transaction();

        transaction.ride =
                null;

        transaction.wallet =
                wallet;

        transaction.transactionType =
                "WALLET_TOP_UP";

        transaction.paymentMethod =
                request.paymentMethod
                        .paymentMethodCode;

        transaction.direction =
                "CREDIT";

        transaction.amount =
                request.amount;

        transaction.transactionStatus =
                "PAID";

        transaction.createdAt =
                now;

        transaction.completedAt =
                now;

        transactionRepository.persistAndFlush(
                transaction
        );

        BigDecimal currentBalance =
                money(wallet.balance);

        wallet.balance =
                currentBalance
                        .add(request.amount)
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        wallet.updatedAt =
                now;

        request.wallet =
                wallet;

        request.requestStatus =
                "APPROVED";

        request.reviewedBy =
                admin;

        request.reviewedAt =
                now;

        request.rejectionReason =
                null;

        request.transaction =
                transaction;

        request.updatedAt =
                now;

        walletRepository.flush();
        topUpRequestRepository.flush();

        return toResponse(
                request,
                "Top-up approved. The driver's wallet has been credited successfully."
        );
    }

    @Transactional
    public AdminWalletTopUpResponse
    reject(
            Integer topUpRequestId,
            AdminRejectWalletTopUpRequest input,
            User admin
    ) {
        requireAdmin(admin);

        if (topUpRequestId == null) {
            throw new BadRequestException(
                    "Top-up request ID is required."
            );
        }

        if (
                input == null ||
                        input.rejectionReason == null ||
                        input.rejectionReason.isBlank()
        ) {
            throw new BadRequestException(
                    "A rejection reason is required."
            );
        }

        String rejectionReason =
                input.rejectionReason.trim();

        if (
                rejectionReason.length() > 500
        ) {
            throw new BadRequestException(
                    "Rejection reason cannot exceed 500 characters."
            );
        }

        WalletTopUpRequest request =
                topUpRequestRepository
                        .findByIdForUpdate(
                                topUpRequestId
                        );

        if (request == null) {
            throw new NotFoundException(
                    "Top-up request was not found."
            );
        }

        requirePending(request);

        LocalDateTime now =
                LocalDateTime.now();

        request.requestStatus =
                "REJECTED";

        request.reviewedBy =
                admin;

        request.reviewedAt =
                now;

        request.rejectionReason =
                rejectionReason;

        request.transaction =
                null;

        request.updatedAt =
                now;

        topUpRequestRepository.flush();

        return toResponse(
                request,
                "Top-up request rejected. The driver's wallet balance was not changed."
        );
    }

    private WalletTopUpRequest findRequest(
            Integer topUpRequestId
    ) {
        if (topUpRequestId == null) {
            throw new BadRequestException(
                    "Top-up request ID is required."
            );
        }

        WalletTopUpRequest request =
                topUpRequestRepository
                        .findById(
                                topUpRequestId
                                        .longValue()
                        );

        if (request == null) {
            throw new NotFoundException(
                    "Top-up request was not found."
            );
        }

        return request;
    }

    private void requirePending(
            WalletTopUpRequest request
    ) {
        if (
                !"PENDING".equalsIgnoreCase(
                        request.requestStatus
                )
        ) {
            throw new WebApplicationException(
                    "This top-up request has already been reviewed.",
                    Response.Status.CONFLICT
            );
        }

        if (request.transaction != null) {
            throw new WebApplicationException(
                    "This top-up request already has a wallet transaction.",
                    Response.Status.CONFLICT
            );
        }
    }

    private String normalizeStatus(
            String requestedStatus
    ) {
        if (
                requestedStatus == null ||
                        requestedStatus.isBlank()
        ) {
            return "PENDING";
        }

        String status =
                requestedStatus
                        .trim()
                        .toUpperCase(
                                Locale.ROOT
                        );

        if (
                !"PENDING".equals(status) &&
                        !"APPROVED".equals(status) &&
                        !"REJECTED".equals(status) &&
                        !"ALL".equals(status)
        ) {
            throw new BadRequestException(
                    "Status must be PENDING, APPROVED, REJECTED, or ALL."
            );
        }

        return status;
    }

    private void requireAdmin(
            User admin
    ) {
        if (
                admin == null ||
                        !Boolean.TRUE.equals(
                                admin.isAdmin
                        )
        ) {
            throw new WebApplicationException(
                    "Admin access is required.",
                    Response.Status.FORBIDDEN
            );
        }
    }

    private BigDecimal money(
            BigDecimal value
    ) {
        return (value == null
                ? BigDecimal.ZERO
                : value).setScale(
                        2,
                        RoundingMode.HALF_UP
                );
    }

    private AdminWalletTopUpResponse
    toResponse(
            WalletTopUpRequest request,
            String message
    ) {
        AdminWalletTopUpResponse response =
                new AdminWalletTopUpResponse();

        response.topUpRequestId =
                request.topUpRequestId;

        response.amount =
                request.amount;

        response.referenceNumber =
                request.referenceNumber;

        response.paymentDate =
                request.paymentDate;

        response.note =
                request.note;

        response.requestStatus =
                request.requestStatus;

        response.submittedAt =
                request.submittedAt;

        response.reviewedAt =
                request.reviewedAt;

        response.rejectionReason =
                request.rejectionReason;

        response.message =
                message;

        if (
                request.paymentMethod != null
        ) {
            response.paymentMethodCode =
                    request.paymentMethod
                            .paymentMethodCode;

            response.paymentMethodName =
                    request.paymentMethod
                            .displayName;
        }

        if (
                request.reviewedBy != null
        ) {
            response.reviewedByUserId =
                    request.reviewedBy.userId;
        }

        if (
                request.transaction != null
        ) {
            response.transactionId =
                    request.transaction
                            .transactionId;
        }

        Wallet wallet =
                request.wallet;

        if (wallet != null) {
            response.walletId =
                    wallet.walletId;

            response.currentBalance =
                    money(wallet.balance);

            response.reservedBalance =
                    money(
                            wallet.reservedBalance
                    );

            response.availableBalance =
                    response.currentBalance
                            .subtract(
                                    response.reservedBalance
                            )
                            .max(
                                    BigDecimal.ZERO
                            )
                            .setScale(
                                    2,
                                    RoundingMode.HALF_UP
                            );

            if (wallet.driver != null) {
                response.driverId =
                        wallet.driver.driverId;

                if (
                        wallet.driver.user != null
                ) {
                    User driverUser =
                            wallet.driver.user;

                    response.userId =
                            driverUser.userId;

                    response.driverName =
                            driverUser.fullName;

                    response.phoneNumber =
                            driverUser.phoneNumber;

                    response.email =
                            driverUser.email;
                }
            }
        }

        return response;
    }
}
