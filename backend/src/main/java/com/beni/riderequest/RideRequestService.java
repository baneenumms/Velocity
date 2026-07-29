package com.beni.riderequest;

import com.beni.dto.CreateRideRequest;
import com.beni.entity.Passenger;
import com.beni.repository.PassengerRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class RideRequestService {

    private static final int REQUEST_LIFETIME_MINUTES = 15;

    /*
     * Passenger may reduce the estimated fare
     * by no more than 10%.
     */
    private static final BigDecimal MINIMUM_FARE_FACTOR =
            new BigDecimal("0.90");

    /*
     * Passenger may increase the offer up to
     * 200% of the estimated fare.
     */
    private static final BigDecimal MAXIMUM_FARE_FACTOR =
            new BigDecimal("2.00");

    private final Map<String, RideRequest> requests =
            new ConcurrentHashMap<>();

    @Inject
    PassengerRepository passengerRepository;

    public RideRequest createRideRequest(
            CreateRideRequest input
    ) {
        validateCreateRequest(input);

        Passenger passenger =
                passengerRepository.findById(
                        input.passengerId.longValue()
                );

        require(
                passenger != null,
                "Passenger not found",
                404
        );

        expireRequests();

        /*
         * A passenger can only have one active
         * SEARCHING request at a time.
         */
        requests.values().stream()
                .filter(request ->
                        request.passengerId.equals(
                                input.passengerId
                        ) &&
                                request.status ==
                                        RideRequestStatus.SEARCHING
                )
                .forEach(request ->
                        request.status =
                                RideRequestStatus.CANCELLED
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
                UUID.randomUUID().toString();

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
                money(estimatedFare).doubleValue();

        ride.passengerFare =
                money(passengerFare).doubleValue();

        ride.estimatedDurationMinutes =
                input.estimatedDurationMinutes;

        ride.paymentMethod =
                paymentMethod(input.paymentMethod);

        ride.status =
                RideRequestStatus.SEARCHING;

        ride.createdAt =
                now;

        ride.fareUpdatedAt =
                null;

        ride.expiresAt =
                now.plusMinutes(
                        REQUEST_LIFETIME_MINUTES
                );

        requests.put(
                ride.requestId,
                ride
        );

        return ride;
    }

    public List<RideRequest> getAvailableRideRequests() {
        expireRequests();

        return requests.values().stream()
                .filter(request ->
                        request.status ==
                                RideRequestStatus.SEARCHING
                )
                .sorted(
                        Comparator.comparing(
                                this::activityTime
                        ).reversed()
                )
                .toList();
    }

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
                requests.get(
                        requestId.trim()
                );

        require(
                ride != null,
                "Ride request not found",
                404
        );

        return ride;
    }

    public RideRequest getPassengerActiveRequest(
            Integer passengerId
    ) {
        require(
                passengerId != null,
                "Passenger ID is required",
                400
        );

        expireRequests();

        return requests.values().stream()
                .filter(request ->
                        request.passengerId.equals(
                                passengerId
                        ) &&
                                request.status ==
                                        RideRequestStatus.SEARCHING
                )
                .max(
                        Comparator.comparing(
                                this::activityTime
                        )
                )
                .orElse(null);
    }

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
                getRideRequest(requestId);

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

        /*
         * Fare updates do not restart the
         * original 15-minute expiry timer.
         */
        return ride;
    }

    public RideRequest cancelRideRequest(
            String requestId,
            Integer passengerId
    ) {
        require(
                passengerId != null,
                "Passenger ID is required",
                400
        );

        RideRequest ride =
                getRideRequest(requestId);

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
                400
        );

        ride.status =
                RideRequestStatus.CANCELLED;

        return ride;
    }

    public synchronized RideRequest markAccepted(
            String requestId
    ) {
        RideRequest ride =
                getRideRequest(requestId);

        require(
                ride.status ==
                        RideRequestStatus.SEARCHING,
                "Ride request is no longer available",
                409
        );

        ride.status =
                RideRequestStatus.ACCEPTED;

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
                input.estimatedDurationMinutes != null &&
                        input.estimatedDurationMinutes > 0,
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
                !pickupAddress(input).isBlank(),
                "Pickup address is required",
                400
        );

        require(
                !dropoffAddress(input).isBlank(),
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

        BigDecimal normalizedEstimatedFare =
                money(estimatedFare);

        BigDecimal minimumFare =
                normalizedEstimatedFare
                        .multiply(
                                MINIMUM_FARE_FACTOR
                        )
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        BigDecimal maximumFare =
                normalizedEstimatedFare
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
                        minimumFare.toPlainString(),
                400
        );

        require(
                offeredFare.compareTo(
                        maximumFare
                ) <= 0,
                "Fare cannot be higher than PKR " +
                        maximumFare.toPlainString(),
                400
        );
    }

    private void expireRequests() {
        LocalDateTime now =
                LocalDateTime.now();

        requests.values().stream()
                .filter(request ->
                        request.status ==
                                RideRequestStatus.SEARCHING &&
                                request.expiresAt != null &&
                                !now.isBefore(
                                        request.expiresAt
                                )
                )
                .forEach(request ->
                        request.status =
                                RideRequestStatus.EXPIRED
                );
    }

    private LocalDateTime activityTime(
            RideRequest request
    ) {
        if (request.fareUpdatedAt != null) {
            return request.fareUpdatedAt;
        }

        return request.createdAt;
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
        return request.pickupLatitude != null
                ? request.pickupLatitude
                : request.pickupLat;
    }

    private Double pickupLng(
            CreateRideRequest request
    ) {
        return request.pickupLongitude != null
                ? request.pickupLongitude
                : request.pickupLng;
    }

    private Double dropoffLat(
            CreateRideRequest request
    ) {
        return request.dropoffLatitude != null
                ? request.dropoffLatitude
                : request.dropoffLat;
    }

    private Double dropoffLng(
            CreateRideRequest request
    ) {
        return request.dropoffLongitude != null
                ? request.dropoffLongitude
                : request.dropoffLng;
    }

    private String pickupAddress(
            CreateRideRequest request
    ) {
        String value =
                request.pickupAddress != null
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
                request.dropoffAddress != null
                        ? request.dropoffAddress
                        : request.dropoffName;

        return value == null
                ? ""
                : value.trim();
    }

    private Double fare(
            CreateRideRequest request
    ) {
        if (request.passengerFare != null) {
            return request.passengerFare;
        }

        return request.requestedFare == null
                ? null
                : request.requestedFare.doubleValue();
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