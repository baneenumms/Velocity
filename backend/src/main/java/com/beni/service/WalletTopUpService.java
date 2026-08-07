package com.beni.service;

import com.beni.dto.CreateWalletTopUpRequest;
import com.beni.dto.DriverWalletSummaryResponse;
import com.beni.dto.TopUpPaymentMethodResponse;
import com.beni.dto.WalletTopUpResponse;
import com.beni.entity.PaymentMethod;
import com.beni.entity.Transaction;
import com.beni.entity.User;
import com.beni.entity.Wallet;
import com.beni.entity.WalletTopUpRequest;
import com.beni.repository.PaymentMethodRepository;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class WalletTopUpService {

    private static final BigDecimal MAX_TOP_UP =
            new BigDecimal("99999999.99");

    @Inject
    WalletRepository walletRepository;

    @Inject
    PaymentMethodRepository
            paymentMethodRepository;

    @Inject
    WalletTopUpRequestRepository
            topUpRequestRepository;

    @Inject
    TransactionRepository
            transactionRepository;

    @Transactional
    public DriverWalletSummaryResponse
    getWalletSummary(Integer driverId) {
        Wallet wallet =
                requireWallet(driverId);

        BigDecimal balance =
                money(wallet.balance);

        BigDecimal reservedBalance =
                money(wallet.reservedBalance);

        DriverWalletSummaryResponse response =
                new DriverWalletSummaryResponse();

        response.walletId =
                wallet.walletId;

        response.driverId =
                wallet.driver.driverId;

        response.balance =
                balance;

        response.reservedBalance =
                reservedBalance;

        response.availableBalance =
                balance
                        .subtract(reservedBalance)
                        .max(BigDecimal.ZERO)
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        return response;
    }

    @Transactional
    public List<TopUpPaymentMethodResponse>
    listPaymentMethods() {
        return paymentMethodRepository
                .listAvailableTopUpMethods()
                .stream()
                .map(method ->
                        new TopUpPaymentMethodResponse(
                                method.paymentMethodCode,
                                method.displayName
                        )
                )
                .toList();
    }

    @Transactional
    public WalletTopUpResponse createTopUp(
            Integer driverId,
            CreateWalletTopUpRequest input
    ) {
        if (input == null) {
            throw new BadRequestException(
                    "Top-up details are required."
            );
        }

        Wallet wallet =
                requireWallet(driverId);

        BigDecimal amount =
                validateAmount(input.amount);

        String paymentMethodCode =
                cleanRequired(
                        input.paymentMethodCode,
                        "Select a payment method."
                )
                        .toUpperCase(
                                Locale.ROOT
                        );

        PaymentMethod paymentMethod =
                paymentMethodRepository
                        .findActiveTopUpMethod(
                                paymentMethodCode
                        );

        if (paymentMethod == null) {
            throw new BadRequestException(
                    "The selected payment method cannot be used for wallet top-ups."
            );
        }

        String referenceNumber =
                cleanRequired(
                        input.referenceNumber,
                        "Payment reference number is required."
                );

        if (referenceNumber.length() > 100) {
            throw new BadRequestException(
                    "Payment reference number cannot exceed 100 characters."
            );
        }

        WalletTopUpRequest existingRequest =
                topUpRequestRepository
                        .findByReferenceNumber(
                                referenceNumber
                        );

        if (existingRequest != null) {
            throw new WebApplicationException(
                    "This payment reference number has already been submitted.",
                    Response.Status.CONFLICT
            );
        }

        LocalDate paymentDate =
                input.paymentDate;

        if (paymentDate == null) {
            throw new BadRequestException(
                    "Payment date is required."
            );
        }

        if (paymentDate.isAfter(
                LocalDate.now()
        )) {
            throw new BadRequestException(
                    "Payment date cannot be in the future."
            );
        }

        String note =
                cleanOptional(input.note);

        if (
                note != null &&
                        note.length() > 500
        ) {
            throw new BadRequestException(
                    "Note cannot exceed 500 characters."
            );
        }

        LocalDateTime now =
                LocalDateTime.now();

        WalletTopUpRequest topUpRequest =
                new WalletTopUpRequest();

        topUpRequest.wallet =
                wallet;

        topUpRequest.amount =
                amount;

        topUpRequest.paymentMethod =
                paymentMethod;

        topUpRequest.referenceNumber =
                referenceNumber;

        topUpRequest.paymentDate =
                paymentDate;

        topUpRequest.note =
                note;

        topUpRequest.requestStatus =
                "PENDING";

        topUpRequest.submittedAt =
                now;

        topUpRequest.updatedAt =
                now;

        topUpRequestRepository.persistAndFlush(
                topUpRequest
        );

        boolean adminDriver =
                wallet.driver != null &&
                        wallet.driver.user != null &&
                        Boolean.TRUE.equals(
                                wallet.driver.user.isAdmin
                        );

        if (!adminDriver) {
            return toResponse(
                    topUpRequest,
                    false,
                    "Top-up request submitted successfully. Your wallet will be credited after admin approval."
            );
        }

        return autoApproveTopUp(
                topUpRequest,
                wallet,
                paymentMethod,
                amount,
                now
        );
    }

    @Transactional
    public List<WalletTopUpResponse>
    listDriverTopUps(Integer driverId) {
        Wallet wallet =
                requireWallet(driverId);

        return topUpRequestRepository
                .listByWalletId(
                        wallet.walletId
                )
                .stream()
                .map(request ->
                        toResponse(
                                request,
                                false,
                                null
                        )
                )
                .toList();
    }

    private WalletTopUpResponse autoApproveTopUp(
            WalletTopUpRequest topUpRequest,
            Wallet originalWallet,
            PaymentMethod paymentMethod,
            BigDecimal amount,
            LocalDateTime now
    ) {
        Wallet lockedWallet =
                walletRepository
                        .findByIdForUpdate(
                                originalWallet.walletId
                        );

        if (lockedWallet == null) {
            throw new NotFoundException(
                    "Driver wallet was not found."
            );
        }

        User adminUser =
                lockedWallet.driver.user;

        Transaction transaction =
                new Transaction();

        transaction.ride =
                null;

        transaction.wallet =
                lockedWallet;

        transaction.transactionType =
                "WALLET_TOP_UP";

        transaction.paymentMethod =
                paymentMethod.paymentMethodCode;

        transaction.direction =
                "CREDIT";

        transaction.amount =
                amount;

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
                money(lockedWallet.balance);

        lockedWallet.balance =
                currentBalance
                        .add(amount)
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        )
                        .doubleValue();

        lockedWallet.updatedAt =
                now;

        topUpRequest.wallet =
                lockedWallet;

        topUpRequest.requestStatus =
                "APPROVED";

        topUpRequest.reviewedBy =
                adminUser;

        topUpRequest.reviewedAt =
                now;

        topUpRequest.rejectionReason =
                null;

        topUpRequest.transaction =
                transaction;

        topUpRequest.updatedAt =
                now;

        walletRepository.flush();
        topUpRequestRepository.flush();

        return toResponse(
                topUpRequest,
                true,
                "Wallet topped up successfully. The amount is now available in your wallet."
        );
    }

    private Wallet requireWallet(
            Integer driverId
    ) {
        if (driverId == null) {
            throw new BadRequestException(
                    "Driver ID is required."
            );
        }

        Wallet wallet =
                walletRepository
                        .findByDriverId(
                                driverId
                        );

        if (
                wallet == null ||
                        wallet.driver == null
        ) {
            throw new NotFoundException(
                    "Driver wallet was not found."
            );
        }

        return wallet;
    }

    private BigDecimal validateAmount(
            BigDecimal suppliedAmount
    ) {
        if (suppliedAmount == null) {
            throw new BadRequestException(
                    "Top-up amount is required."
            );
        }

        BigDecimal amount;

        try {
            amount =
                    suppliedAmount.setScale(
                            2,
                            RoundingMode.UNNECESSARY
                    );
        } catch (ArithmeticException exception) {
            throw new BadRequestException(
                    "Top-up amount can have no more than two decimal places."
            );
        }

        if (
                amount.compareTo(
                        BigDecimal.ZERO
                ) <= 0
        ) {
            throw new BadRequestException(
                    "Top-up amount must be greater than zero."
            );
        }

        if (
                amount.compareTo(
                        MAX_TOP_UP
                ) > 0
        ) {
            throw new BadRequestException(
                    "Top-up amount is too large."
            );
        }

        return amount;
    }

    private String cleanRequired(
            String value,
            String errorMessage
    ) {
        if (
                value == null ||
                        value.isBlank()
        ) {
            throw new BadRequestException(
                    errorMessage
            );
        }

        return value.trim();
    }

    private String cleanOptional(
            String value
    ) {
        if (
                value == null ||
                        value.isBlank()
        ) {
            return null;
        }

        return value.trim();
    }

    private BigDecimal money(
            Double value
    ) {
        if (value == null) {
            return new BigDecimal("0.00");
        }

        return BigDecimal
                .valueOf(value)
                .setScale(
                        2,
                        RoundingMode.HALF_UP
                );
    }

    private WalletTopUpResponse toResponse(
            WalletTopUpRequest request,
            boolean autoApproved,
            String message
    ) {
        WalletTopUpResponse response =
                new WalletTopUpResponse();

        response.topUpRequestId =
                request.topUpRequestId;

        if (
                request.wallet != null
        ) {
            response.walletId =
                    request.wallet.walletId;

            if (
                    request.wallet.driver != null
            ) {
                response.driverId =
                        request.wallet
                                .driver
                                .driverId;
            }
        }

        response.amount =
                request.amount;

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

        if (
                request.reviewedBy != null
        ) {
            response.reviewedByUserId =
                    request.reviewedBy.userId;
        }

        response.reviewedAt =
                request.reviewedAt;

        response.rejectionReason =
                request.rejectionReason;

        if (
                request.transaction != null
        ) {
            response.transactionId =
                    request.transaction
                            .transactionId;
        }

        response.autoApproved =
                autoApproved;

        response.message =
                message;

        return response;
    }
}