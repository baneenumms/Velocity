package com.beni.service;

import com.beni.dto.EstimateRideRequest;
import com.beni.dto.EstimateRideResponse;
import com.beni.dto.PassengerTripResponse;
import com.beni.dto.RideStatusResponse;
import com.beni.dto.StartRideRequest;
import com.beni.entity.Driver;
import com.beni.entity.DriverStatus;
import com.beni.entity.Passenger;
import com.beni.entity.Ride;
import com.beni.entity.RideStatus;
import com.beni.entity.Transaction;
import com.beni.entity.Vehicle;
import com.beni.entity.Wallet;
import com.beni.repository.PassengerRepository;
import com.beni.repository.RideRepository;
import com.beni.repository.TransactionRepository;
import com.beni.repository.WalletRepository;
import com.beni.riderequest.RideRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

@ApplicationScoped
public class RideService {

    private static final double EARTH_RADIUS = 6371;
    private static final double BASE_FARE = 150;
    private static final double PER_KM = 40;

    private static final BigDecimal PLATFORM_RATE =
            new BigDecimal("0.12");

    private static final BigDecimal CANCEL_RATE =
            new BigDecimal("0.05");

    @Inject
    RideRepository rideRepository;

    @Inject
    PassengerRepository passengerRepository;

    @Inject
    WalletRepository walletRepository;

    @Inject
    TransactionRepository transactionRepository;

    public EstimateRideResponse estimateRide(
            EstimateRideRequest input
    ) {
        require(
                input != null,
                "Request body is required",
                400
        );

        double distance = distance(
                input.pickupLat,
                input.pickupLng,
                input.dropoffLat,
                input.dropoffLng
        );

        double fare =
                BASE_FARE +
                        distance * PER_KM;

        EstimateRideResponse response =
                new EstimateRideResponse();

        response.distanceKm =
                round(distance);

        response.estimatedFare =
                money(fare);

        /*
         * Passenger can reduce by at most 10%.
         */
        response.minimumFare =
                money(fare * 0.90);

        /*
         * Passenger can increase up to 200%
         * of the estimated fare.
         */
        response.maximumFare =
                money(fare * 2.00);

        return response;
    }

    @Transactional
    public List<PassengerTripResponse>
    getPassengerTripHistory(
            Integer passengerId
    ) {
        require(
                passengerId != null &&
                        passengerId > 0,
                "Valid passenger ID is required",
                400
        );

        Passenger passenger =
                passengerRepository.findById(
                        passengerId.longValue()
                );

        require(
                passenger != null,
                "Passenger not found",
                404
        );

        return rideRepository
                .findByPassenger(passenger)
                .stream()
                .filter(ride ->
                        ride.rideStatus ==
                                RideStatus.COMPLETED ||
                                ride.rideStatus ==
                                        RideStatus.CANCELLED
                )
                .map(this::toPassengerTripResponse)
                .toList();
    }

    @Transactional
    public Ride createAcceptedRide(
            RideRequest request,
            Driver driver,
            Vehicle vehicle,
            BigDecimal acceptedFare,
            BigDecimal reservedAmount,
            String pinHash
    ) {
        require(
                request != null,
                "Ride request is required",
                400
        );

        require(
                driver != null,
                "Driver is required",
                400
        );

        require(
                vehicle != null,
                "Vehicle is required",
                400
        );

        Passenger passenger =
                passengerRepository.findById(
                        request.passengerId.longValue()
                );

        require(
                passenger != null,
                "Passenger not found",
                404
        );

        double distance = distance(
                request.pickupLatitude,
                request.pickupLongitude,
                request.dropoffLatitude,
                request.dropoffLongitude
        );

        int durationMinutes =
                request.estimatedDurationMinutes != null &&
                        request.estimatedDurationMinutes > 0
                        ? request.estimatedDurationMinutes
                        : Math.max(
                        1,
                        (int) Math.ceil(
                                distance * 2.0
                        )
                );

        Ride ride = new Ride();

        ride.passenger = passenger;
        ride.driver = driver;
        ride.vehicle = vehicle;

        ride.pickupName =
                request.pickupAddress;

        ride.pickupLat =
                request.pickupLatitude;

        ride.pickupLng =
                request.pickupLongitude;

        ride.dropoffName =
                request.dropoffAddress;

        ride.dropoffLat =
                request.dropoffLatitude;

        ride.dropoffLng =
                request.dropoffLongitude;

        ride.distanceKm =
                money(distance);

        ride.estimatedFare =
                money(
                        BASE_FARE +
                                distance * PER_KM
                );

        ride.requestedFare =
                money(
                        request.passengerFare
                );

        ride.acceptedFare =
                scale(acceptedFare);

        ride.paymentMethod =
                paymentMethod(
                        request.paymentMethod
                );

        ride.paymentStatus =
                "PENDING";

        ride.walletReservedAmount =
                scale(reservedAmount);

        ride.platformFeeAmount =
                BigDecimal.ZERO;

        ride.estimatedDurationMinutes =
                durationMinutes;

        ride.feeDeductionDueAt =
                null;

        ride.platformFeeDeducted =
                false;

        ride.platformFeeDeductedAt =
                null;

        ride.cancellationFee =
                BigDecimal.ZERO;

        ride.ridePinHash =
                pinHash;

        ride.rideStatus =
                RideStatus.ACCEPTED;

        ride.requestedAt =
                request.createdAt == null
                        ? LocalDateTime.now()
                        : request.createdAt;

        ride.acceptedAt =
                LocalDateTime.now();

        rideRepository.persist(ride);
        rideRepository.flush();

        return ride;
    }

    @Transactional
    public RideStatusResponse startRide(
            Integer rideId,
            StartRideRequest input
    ) {
        Ride ride =
                findRide(rideId);

        require(
                input != null &&
                        input.driverId != null &&
                        input.ridePin != null &&
                        input.ridePin
                                .trim()
                                .matches("\\d{4}"),
                "Valid driver ID and 4-digit PIN are required",
                400
        );

        require(
                ride.rideStatus ==
                        RideStatus.ACCEPTED,
                "Only accepted rides can be started",
                400
        );

        require(
                ride.driver.driverId.equals(
                        input.driverId
                ),
                "Ride belongs to another driver",
                403
        );

        require(
                pinMatches(
                        input.ridePin.trim(),
                        ride.ridePinHash
                ),
                "Incorrect ride PIN",
                400
        );

        LocalDateTime startedAt =
                LocalDateTime.now();

        int durationMinutes;

        if (
                ride.estimatedDurationMinutes != null &&
                        ride.estimatedDurationMinutes > 0
        ) {
            durationMinutes =
                    ride.estimatedDurationMinutes;
        } else {
            double distanceKm =
                    ride.distanceKm == null
                            ? 0
                            : ride.distanceKm
                                    .doubleValue();

            /*
             * Fallback assumes approximately
             * 30 km/h city driving:
             * about 2 minutes per kilometre.
             */
            durationMinutes =
                    Math.max(
                            1,
                            (int) Math.ceil(
                                    distanceKm * 2.0
                            )
                    );

            ride.estimatedDurationMinutes =
                    durationMinutes;
        }

        ride.startedAt =
                startedAt;

        /*
         * Reserved 12% becomes deductible after:
         *
         * estimated journey duration
         * + 10-minute grace period.
         */
        ride.feeDeductionDueAt =
                startedAt.plusMinutes(
                        durationMinutes + 10L
                );

        ride.rideStatus =
                RideStatus.IN_PROGRESS;

        ride.driver.driverStatus =
                DriverStatus.OnTrip;

        return response(
                ride,
                "Ride started successfully"
        );
    }

    @Transactional
    public RideStatusResponse completeRide(
            Integer rideId
    ) {
        Ride ride =
                findRide(rideId);

        require(
                ride.rideStatus ==
                        RideStatus.IN_PROGRESS,
                "Only in-progress rides can be completed",
                400
        );

        /*
         * Complete Ride does not deduct the
         * reserved platform fee.
         *
         * The automatic scheduler deducts it
         * when feeDeductionDueAt is reached.
         */
        ride.rideStatus =
                RideStatus.COMPLETED;

        ride.completedAt =
                LocalDateTime.now();

        /*
         * Completing the ride unlocks the driver
         * so new ride requests can appear again.
         */
        ride.driver.driverStatus =
                DriverStatus.Online;

        return response(
                ride,
                "Ride completed successfully. New ride requests are now available."
        );
    }
    @Transactional(
            Transactional.TxType.REQUIRES_NEW
    )
    public void deductScheduledPlatformFee(
            Integer rideId
    ) {
        Ride ride =
                findRide(rideId);

        LocalDateTime now =
                LocalDateTime.now();

        if (
                Boolean.TRUE.equals(
                        ride.platformFeeDeducted
                )
        ) {
            return;
        }

        if (
                ride.feeDeductionDueAt == null ||
                        ride.feeDeductionDueAt.isAfter(now)
        ) {
            return;
        }

        /*
         * The fee must still be deducted when the
         * ride was completed before the deadline.
         */
        boolean deductibleStatus =
                ride.rideStatus ==
                        RideStatus.IN_PROGRESS ||
                        ride.rideStatus ==
                                RideStatus.COMPLETED;

        if (!deductibleStatus) {
            return;
        }

        BigDecimal reservedFee =
                scale(
                        ride.walletReservedAmount
                );

        BigDecimal fee =
                reservedFee.signum() > 0
                        ? reservedFee
                        : percentage(
                        ride.acceptedFare,
                        PLATFORM_RATE
                );

        if (fee.signum() <= 0) {
            return;
        }

        Wallet wallet =
                findWallet(
                        ride.driver
                );

        BigDecimal balance =
                money(
                        wallet.balance
                );

        BigDecimal reservedBalance =
                money(
                        wallet.reservedBalance
                );

        require(
                balance.compareTo(fee) >= 0,
                "Driver wallet balance is insufficient",
                400
        );

        require(
                reservedBalance.compareTo(fee) >= 0,
                "Reserved wallet balance is insufficient",
                400
        );

        wallet.balance =
                balance
                        .subtract(fee);

        wallet.reservedBalance =
                reservedBalance
                        .subtract(fee)
                        .max(BigDecimal.ZERO);

        wallet.updatedAt =
                now;

        ride.walletReservedAmount =
                BigDecimal.ZERO;

        ride.platformFeeAmount =
                fee;

        ride.platformFeeDeducted =
                true;

        ride.platformFeeDeductedAt =
                now;

        recordFee(
                ride,
                wallet,
                "PLATFORM_FEE",
                fee
        );
    }
    @Transactional
    public RideStatusResponse cancelRide(
            Integer rideId,
            String cancelledBy,
            String reason
    ) {
        Ride ride =
                findRide(rideId);

        require(
                ride.rideStatus ==
                        RideStatus.ACCEPTED,
                "Only accepted rides can be cancelled",
                400
        );

        String actor =
                cancellationActor(
                        cancelledBy
                );

        Wallet wallet =
                findWallet(
                        ride.driver
                );

        BigDecimal balance =
                money(
                        wallet.balance
                );

        BigDecimal reserved =
                money(
                        wallet.reservedBalance
                );

        BigDecimal reservedFee =
                scale(
                        ride.walletReservedAmount
                );

        BigDecimal cancellationFee =
                actor.equals("DRIVER")
                        ? percentage(
                        ride.acceptedFare,
                        CANCEL_RATE
                )
                        : BigDecimal.ZERO;

        require(
                balance.compareTo(
                        cancellationFee
                ) >= 0,
                "Driver wallet balance is insufficient",
                400
        );

        wallet.balance =
                balance
                        .subtract(
                                cancellationFee
                        );

        wallet.reservedBalance =
                reserved
                        .subtract(
                                reservedFee
                        )
                        .max(
                                BigDecimal.ZERO
                        );

        wallet.updatedAt =
                LocalDateTime.now();

        ride.walletReservedAmount =
                BigDecimal.ZERO;

        ride.cancellationFee =
                cancellationFee;

        ride.cancelledBy =
                actor;

        ride.cancellationReason =
                reason == null ||
                        reason.isBlank()
                        ? null
                        : reason.trim();

        ride.cancelledAt =
                LocalDateTime.now();

        ride.rideStatus =
                RideStatus.CANCELLED;

        ride.driver.driverStatus =
                DriverStatus.Online;

        if (
                cancellationFee.signum() >
                        0
        ) {
            recordFee(
                    ride,
                    wallet,
                    "CANCELLATION_FEE",
                    cancellationFee
            );
        }

        return response(
                ride,
                "Ride cancelled successfully"
        );
    }

    private PassengerTripResponse
    toPassengerTripResponse(
            Ride ride
    ) {
        applyDefaults(ride);

        PassengerTripResponse item =
                new PassengerTripResponse();

        item.rideId =
                ride.rideId;

        item.rideStatus =
                ride.rideStatus == null
                        ? "UNKNOWN"
                        : ride.rideStatus.name();

        item.pickupLocation =
                ride.pickupName;

        item.dropoffLocation =
                ride.dropoffName;

        item.distanceKm =
                ride.distanceKm;

        item.finalFare =
                ride.acceptedFare;

        item.paymentMethod =
                ride.paymentMethod;

        item.requestedAt =
                ride.requestedAt;

        item.acceptedAt =
                ride.acceptedAt;

        item.startedAt =
                ride.startedAt;

        item.completedAt =
                ride.completedAt;

        item.cancelledAt =
                ride.cancelledAt;

        item.cancelledBy =
                ride.cancelledBy;

        item.cancellationReason =
                ride.cancellationReason;

        if (ride.driver != null) {
            item.driverId =
                    ride.driver.driverId;

            if (
                    ride.driver.user != null &&
                            ride.driver.user.fullName != null &&
                            !ride.driver.user.fullName.isBlank()
            ) {
                item.driverName =
                        ride.driver.user.fullName;
            } else {
                item.driverName =
                        "Driver #" +
                                ride.driver.driverId;
            }
        } else {
            item.driverName =
                    "Driver unavailable";
        }

        return item;
    }

    private void recordFee(
            Ride ride,
            Wallet wallet,
            String type,
            BigDecimal amount
    ) {
        if (
                amount == null ||
                        amount.signum() <= 0 ||
                        transactionRepository
                                .findByRideAndType(
                                        ride.rideId,
                                        type
                                ) != null
        ) {
            return;
        }

        Transaction transaction =
                new Transaction();

        transaction.ride =
                ride;

        transaction.wallet =
                wallet;

        transaction.transactionType =
                type;

        transaction.paymentMethod =
                "WALLET";

        transaction.direction =
                "DEBIT";

        transaction.amount =
                scale(amount);

        transaction.transactionStatus =
                "PAID";

        transaction.completedAt =
                LocalDateTime.now();

        transactionRepository.persist(
                transaction
        );
    }

    private Ride findRide(
            Integer rideId
    ) {
        require(
                rideId != null &&
                        rideId > 0,
                "Valid ride ID is required",
                400
        );

        Ride ride =
                rideRepository.findById(
                        rideId.longValue()
                );

        require(
                ride != null,
                "Ride not found",
                404
        );

        applyDefaults(ride);

        return ride;
    }

    private void applyDefaults(
            Ride ride
    ) {
        if (
                ride.paymentMethod ==
                        null
        ) {
            ride.paymentMethod =
                    "CASH";
        }

        if (
                ride.paymentStatus ==
                        null
        ) {
            ride.paymentStatus =
                    "PENDING";
        }

        if (
                ride.walletReservedAmount ==
                        null
        ) {
            ride.walletReservedAmount =
                    BigDecimal.ZERO;
        }

        if (
                ride.platformFeeAmount ==
                        null
        ) {
            ride.platformFeeAmount =
                    BigDecimal.ZERO;
        }

        if (
                ride.cancellationFee ==
                        null
        ) {
            ride.cancellationFee =
                    BigDecimal.ZERO;
        }
    }

    private Wallet findWallet(
            Driver driver
    ) {
        Wallet wallet =
                walletRepository.findByDriver(
                        driver
                );

        require(
                wallet != null,
                "Driver wallet not found",
                404
        );

        return wallet;
    }

    private String paymentMethod(
            String value
    ) {
        String method =
                value == null
                        ? ""
                        : value
                        .trim()
                        .toUpperCase();

        require(
                method.equals("CASH") ||
                        method.equals(
                                "DIGITAL_TRANSFER"
                        ),
                "Payment method must be CASH or DIGITAL_TRANSFER",
                400
        );

        return method;
    }

    private String cancellationActor(
            String value
    ) {
        String actor =
                value == null ||
                        value.isBlank()
                        ? "PASSENGER"
                        : value
                        .trim()
                        .toUpperCase();

        require(
                actor.equals(
                        "PASSENGER"
                ) ||
                        actor.equals(
                                "DRIVER"
                        ),
                "Invalid cancellation actor",
                400
        );

        return actor;
    }

    private RideStatusResponse response(
            Ride ride,
            String message
    ) {
        RideStatusResponse response =
                new RideStatusResponse();

        response.success =
                true;

        response.message =
                message;

        response.rideId =
                ride.rideId;

        response.status =
                ride.rideStatus.name();

        return response;
    }

    private boolean pinMatches(
            String pin,
            String storedHash
    ) {
        require(
                storedHash != null,
                "Ride PIN is unavailable",
                500
        );

        return MessageDigest.isEqual(
                hash(pin).getBytes(
                        StandardCharsets.UTF_8
                ),
                storedHash.getBytes(
                        StandardCharsets.UTF_8
                )
        );
    }

    private String hash(
            String value
    ) {
        try {
            byte[] bytes =
                    MessageDigest
                            .getInstance(
                                    "SHA-256"
                            )
                            .digest(
                                    value.getBytes(
                                            StandardCharsets.UTF_8
                                    )
                            );

            return HexFormat
                    .of()
                    .formatHex(bytes);

        } catch (Exception error) {
            throw new WebApplicationException(
                    "Could not verify ride PIN",
                    500
            );
        }
    }

    private BigDecimal percentage(
            BigDecimal amount,
            BigDecimal rate
    ) {
        return scale(
                scale(amount)
                        .multiply(rate)
        );
    }

    private BigDecimal scale(
            BigDecimal value
    ) {
        return (
                value == null
                        ? BigDecimal.ZERO
                        : value
        ).setScale(
                2,
                RoundingMode.HALF_UP
        );
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

    private BigDecimal money(
            double value
    ) {
        return BigDecimal
                .valueOf(value)
                .setScale(
                        2,
                        RoundingMode.HALF_UP
                );
    }

    private double round(
            double value
    ) {
        return money(
                value
        ).doubleValue();
    }

    private double distance(
            double lat1,
            double lon1,
            double lat2,
            double lon2
    ) {
        double dLat =
                Math.toRadians(
                        lat2 - lat1
                );

        double dLon =
                Math.toRadians(
                        lon2 - lon1
                );

        double a =
                Math.sin(dLat / 2) *
                        Math.sin(dLat / 2) +
                        Math.cos(
                                Math.toRadians(
                                        lat1
                                )
                        ) *
                                Math.cos(
                                        Math.toRadians(
                                                lat2
                                        )
                                ) *
                                Math.sin(dLon / 2) *
                                Math.sin(dLon / 2);

        return EARTH_RADIUS *
                2 *
                Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(1 - a)
                );
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
