package com.beni.riderequest;

import com.beni.dto.CreateRideRequest;
import com.beni.entity.Passenger;
import com.beni.repository.PassengerRepository;
import com.beni.repository.DriverRepository;
import com.beni.service.ActiveRidePolicyService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.SQLException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class RideRequestService {

    private static final int
            REQUEST_LIFETIME_MINUTES = 15;

    private static final BigDecimal
            MINIMUM_FARE_FACTOR =
            new BigDecimal("0.90");

    private static final BigDecimal
            MAXIMUM_FARE_FACTOR =
            new BigDecimal("2.00");

    @Inject
    PassengerRepository passengerRepository;

    @Inject
    DriverRepository driverRepository;

    @Inject
    ActiveRidePolicyService
            activeRidePolicyService;

    @Inject
    RideRequestRepository rideRequestRepository;

    @Inject
    DriverOfferRepository driverOfferRepository;

    @Transactional
    public RideRequest
    createRideRequest(
            CreateRideRequest input
    ) {
        validateCreateRequest(input);

        Passenger passenger =
                passengerRepository.findById(
                        input.passengerId
                                .longValue()
                );

        require(
                passenger != null,
                "Passenger not found",
                404
        );

        /*
         * An ACCEPTED or IN_PROGRESS
         * database ride blocks a new request.
         */
        activeRidePolicyService
                .requirePassengerAvailable(
                        input.passengerId
                );

        expireRequests();

        /*
         * Never silently cancel an existing
         * search. The passenger must cancel
         * it explicitly.
         */
        boolean alreadySearching =
                rideRequestRepository
                        .findSearchingByPassenger(
                                input.passengerId
                        ) != null;

        require(
                !alreadySearching,
                "You already have an active ride search. Cancel it before requesting another ride.",
                409
        );

        BigDecimal estimatedFare =
                estimatedFare(input);

        Double passengerFare =
                fare(input);

        LocalDateTime now =
                LocalDateTime.now();

        RideRequest ride =
                new RideRequest();

        ride.requestId =
                UUID.randomUUID()
                        .toString();

        ride.passengerId =
                input.passengerId;

        ride.pickupLatitude =
                pickupLat(input);

        ride.pickupLongitude =
                pickupLng(input);

        ride.pickupAddress =
                pickupAddress(input);

        ride.dropoffLatitude =
                dropoffLat(input);

        ride.dropoffLongitude =
                dropoffLng(input);

        ride.dropoffAddress =
                dropoffAddress(input);

        ride.estimatedFare =
                money(estimatedFare)
                        .doubleValue();

        ride.passengerFare =
                money(passengerFare)
                        .doubleValue();

        ride.estimatedDurationMinutes =
                input.estimatedDurationMinutes;

        ride.paymentMethod =
                paymentMethod(
                        input.paymentMethod
                );

        ride.status =
                RideRequestStatus.SEARCHING;

        ride.createdAt = now;

        ride.fareUpdatedAt = null;

        ride.expiresAt =
                now.plusMinutes(
                        REQUEST_LIFETIME_MINUTES
                );

        try {
            rideRequestRepository
                    .persistAndFlush(ride);
        } catch (PersistenceException error) {
            if (isUniqueViolation(error)) {
                throw new WebApplicationException(
                        "You already have an active ride search. Cancel it before requesting another ride.",
                        409
                );
            }

            throw error;
        }

        return ride;
    }

    @Transactional
    public long onlineDriverCount() {
        return driverRepository.countOnlineDrivers();
    }

    public long remainingSearchSeconds(RideRequest request) {
        if (
                request == null ||
                        request.status != RideRequestStatus.SEARCHING ||
                        request.expiresAt == null
        ) {
            return 0;
        }

        return Math.max(
                0,
                Duration.between(
                        LocalDateTime.now(),
                        request.expiresAt
                ).getSeconds()
        );
    }

    @Transactional
    public List<RideRequest>
    getAvailableRideRequests(Integer driverId) {
        expireRequests();

        var driver = driverRepository.findById(driverId.longValue());
        require(driver != null, "Driver not found", 404);

        return rideRequestRepository
                .listSearching()
                .stream()
                .filter(
                        request ->
                                isNotDriversOwnRequest(
                                        request,
                                        driver.user.userId
                                )
                )
                .toList();
    }

    private boolean isNotDriversOwnRequest(RideRequest request, Integer driverUserId) {
        Passenger passenger = passengerRepository.findById(request.passengerId.longValue());
        return passenger != null && passenger.user != null &&
                !passenger.user.userId.equals(driverUserId);
    }

    @Transactional
    public RideRequest getRideRequest(
            String requestId
    ) {
        require(
                requestId != null &&
                        !requestId.isBlank(),
                "Request ID is required",
                400
        );

        expireRequests();

        RideRequest ride =
                rideRequestRepository
                        .findByRequestId(requestId);

        require(
                ride != null,
                "Ride request not found",
                404
        );

        return ride;
    }

    @Transactional
    public RideRequest
    getPassengerActiveRequest(
            Integer passengerId
    ) {
        require(
                passengerId != null &&
                        passengerId > 0,
                "Valid passenger ID is required",
                400
        );

        expireRequests();

        return rideRequestRepository
                .findSearchingByPassenger(
                        passengerId
                );
    }

    @Transactional
    public RideRequest updatePassengerFare(
            String requestId,
            UpdateRideFareRequest input
    ) {
        require(
                input != null,
                "Request body is required",
                400
        );

        require(
                input.passengerId != null,
                "Passenger ID is required",
                400
        );

        require(
                input.passengerFare != null &&
                        Double.isFinite(
                                input.passengerFare
                        ) &&
                        input.passengerFare > 0,
                "Passenger fare must be greater than zero",
                400
        );

        RideRequest ride =
                getRideRequestForUpdate(requestId);

        require(
                ride.passengerId.equals(
                        input.passengerId
                ),
                "This request belongs to another passenger",
                403
        );

        require(
                ride.status ==
                        RideRequestStatus.SEARCHING,
                "Only searching requests can be updated",
                409
        );

        require(
                ride.estimatedFare != null &&
                        Double.isFinite(
                                ride.estimatedFare
                        ) &&
                        ride.estimatedFare > 0,
                "Estimated fare is missing from this request",
                400
        );

        validateFareRange(
                input.passengerFare,
                BigDecimal.valueOf(
                        ride.estimatedFare
                )
        );

        ride.passengerFare =
                money(
                        input.passengerFare
                ).doubleValue();

        ride.fareUpdatedAt =
                LocalDateTime.now();

        return ride;
    }

    @Transactional
    public RideRequest
    cancelRideRequest(
            String requestId,
            Integer passengerId
    ) {
        require(
                passengerId != null,
                "Passenger ID is required",
                400
        );

        RideRequest ride =
                getRideRequestForUpdate(requestId);

        require(
                ride.passengerId.equals(
                        passengerId
                ),
                "This request belongs to another passenger",
                403
        );

        require(
                ride.status ==
                        RideRequestStatus.SEARCHING,
                "Only searching requests can be cancelled",
                409
        );

        ride.status =
                RideRequestStatus.CANCELLED;

        driverOfferRepository
                .withdrawPendingByRequest(
                        ride.requestId,
                        LocalDateTime.now()
                );

        return ride;
    }

    private void validateCreateRequest(
            CreateRideRequest input
    ) {
        require(
                input != null,
                "Request body is required",
                400
        );

        require(
                input.passengerId != null,
                "Passenger ID is required",
                400
        );

        require(
                input.estimatedDurationMinutes !=
                        null &&
                        input.estimatedDurationMinutes >
                                0,
                "Estimated duration must be greater than zero",
                400
        );

        require(
                validLatitude(
                        pickupLat(input)
                ),
                "Invalid pickup latitude",
                400
        );

        require(
                validLongitude(
                        pickupLng(input)
                ),
                "Invalid pickup longitude",
                400
        );

        require(
                validLatitude(
                        dropoffLat(input)
                ),
                "Invalid drop-off latitude",
                400
        );

        require(
                validLongitude(
                        dropoffLng(input)
                ),
                "Invalid drop-off longitude",
                400
        );

        require(
                !pickupAddress(input)
                        .isBlank(),
                "Pickup address is required",
                400
        );

        require(
                !dropoffAddress(input)
                        .isBlank(),
                "Drop-off address is required",
                400
        );

        BigDecimal estimated =
                estimatedFare(input);

        require(
                estimated != null &&
                        estimated.compareTo(
                                BigDecimal.ZERO
                        ) > 0,
                "Estimated fare must be greater than zero",
                400
        );

        Double passengerFare =
                fare(input);

        require(
                passengerFare != null &&
                        Double.isFinite(
                                passengerFare
                        ) &&
                        passengerFare > 0,
                "Passenger fare must be greater than zero",
                400
        );

        validateFareRange(
                passengerFare,
                estimated
        );

        paymentMethod(
                input.paymentMethod
        );
    }

    private void validateFareRange(
            Double passengerFare,
            BigDecimal estimatedFare
    ) {
        BigDecimal offeredFare =
                money(passengerFare);

        BigDecimal normalizedEstimated =
                money(estimatedFare);

        BigDecimal minimumFare =
                normalizedEstimated
                        .multiply(
                                MINIMUM_FARE_FACTOR
                        )
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        BigDecimal maximumFare =
                normalizedEstimated
                        .multiply(
                                MAXIMUM_FARE_FACTOR
                        )
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        require(
                offeredFare.compareTo(
                        minimumFare
                ) >= 0,
                "Fare cannot be lower than PKR " +
                        minimumFare
                                .toPlainString(),
                400
        );

        require(
                offeredFare.compareTo(
                        maximumFare
                ) <= 0,
                "Fare cannot be higher than PKR " +
                        maximumFare
                                .toPlainString(),
                400
        );
    }

    RideRequest getRideRequestForUpdate(
            String requestId
    ) {
        require(
                requestId != null &&
                        !requestId.isBlank(),
                "Request ID is required",
                400
        );

        RideRequest ride =
                rideRequestRepository
                        .findByRequestIdForUpdate(
                                requestId
                        );

        require(
                ride != null,
                "Ride request not found",
                404
        );

        LocalDateTime now =
                LocalDateTime.now();

        if (
                ride.status == RideRequestStatus.SEARCHING &&
                        ride.expiresAt != null &&
                        !ride.expiresAt.isAfter(
                                now
                        )
        ) {
            ride.status = RideRequestStatus.EXPIRED;

            driverOfferRepository
                    .withdrawPendingByRequest(
                            ride.requestId,
                            now
                    );
        }

        return ride;
    }

    private void expireRequests() {
        LocalDateTime now =
                LocalDateTime.now();

        rideRequestRepository.expireSearching(now);

        driverOfferRepository
                .withdrawPendingForInactiveRequests(
                        now
                );
    }

    private boolean isUniqueViolation(
            Throwable error
    ) {
        Throwable cause = error;

        while (cause != null) {
            if (
                    cause instanceof SQLException sqlError &&
                            "23505".equals(
                                    sqlError.getSQLState()
                            )
            ) {
                return true;
            }

            cause = cause.getCause();
        }

        return false;
    }

    private String paymentMethod(
            String value
    ) {
        String method =
                value == null
                        ? ""
                        : value.trim()
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

    private BigDecimal estimatedFare(
            CreateRideRequest request
    ) {
        return request.estimatedFare;
    }

    private Double pickupLat(
            CreateRideRequest request
    ) {
        return request.pickupLatitude !=
                null
                ? request.pickupLatitude
                : request.pickupLat;
    }

    private Double pickupLng(
            CreateRideRequest request
    ) {
        return request.pickupLongitude !=
                null
                ? request.pickupLongitude
                : request.pickupLng;
    }

    private Double dropoffLat(
            CreateRideRequest request
    ) {
        return request.dropoffLatitude !=
                null
                ? request.dropoffLatitude
                : request.dropoffLat;
    }

    private Double dropoffLng(
            CreateRideRequest request
    ) {
        return request.dropoffLongitude !=
                null
                ? request.dropoffLongitude
                : request.dropoffLng;
    }

    private String pickupAddress(
            CreateRideRequest request
    ) {
        String value =
                request.pickupAddress !=
                        null
                        ? request.pickupAddress
                        : request.pickupName;

        return value == null
                ? ""
                : value.trim();
    }

    private String dropoffAddress(
            CreateRideRequest request
    ) {
        String value =
                request.dropoffAddress !=
                        null
                        ? request.dropoffAddress
                        : request.dropoffName;

        return value == null
                ? ""
                : value.trim();
    }

    private Double fare(
            CreateRideRequest request
    ) {
        if (
                request.passengerFare !=
                        null
        ) {
            return request.passengerFare;
        }

        return request.requestedFare ==
                null
                ? null
                : request.requestedFare
                .doubleValue();
    }

    private BigDecimal money(
            Double value
    ) {
        return BigDecimal.valueOf(
                value == null
                        ? 0
                        : value
        ).setScale(
                2,
                RoundingMode.HALF_UP
        );
    }

    private BigDecimal money(
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

    private boolean validLatitude(
            Double value
    ) {
        return value != null &&
                Double.isFinite(value) &&
                value >= -90 &&
                value <= 90;
    }

    private boolean validLongitude(
            Double value
    ) {
        return value != null &&
                Double.isFinite(value) &&
                value >= -180 &&
                value <= 180;
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
