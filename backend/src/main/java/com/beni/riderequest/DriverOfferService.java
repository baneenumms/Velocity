package com.beni.riderequest;

import com.beni.entity.Driver;
import com.beni.entity.DriverStatus;
import com.beni.entity.Ride;
import com.beni.entity.Vehicle;
import com.beni.entity.Wallet;
import com.beni.repository.DriverRepository;
import com.beni.repository.VehicleRepository;
import com.beni.repository.WalletRepository;
import com.beni.service.ActiveRidePolicyService;
import com.beni.service.RideService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class DriverOfferService {

    private static final BigDecimal RATE =
            new BigDecimal("0.12");

    private final Map<
            String,
            DriverOffer
            > offers =
            new ConcurrentHashMap<>();

    private final SecureRandom random =
            new SecureRandom();

    @Inject
    RideRequestService rideRequestService;

    @Inject
    DriverRepository driverRepository;

    @Inject
    VehicleRepository vehicleRepository;

    @Inject
    WalletRepository walletRepository;

    @Inject
    RideService rideService;

    @Inject
    ActiveRidePolicyService
            activeRidePolicyService;

    public synchronized DriverOffer
    submitOffer(
            SubmitDriverOfferRequest input
    ) {
        validate(input);

        /*
         * A driver with an ACCEPTED or
         * IN_PROGRESS ride cannot submit
         * another offer.
         */
        activeRidePolicyService
                .requireDriverAvailable(
                        input.driverId
                );

        RideRequest request =
                rideRequestService
                        .getRideRequest(
                                input.requestId
                        );

        require(
                request.status ==
                        RideRequestStatus.SEARCHING,
                "Ride request is no longer available",
                409
        );

        Driver driver =
                driver(
                        input.driverId
                );

        require(
                driver.driverStatus ==
                        DriverStatus.Online,
                "Driver must be Online",
                409
        );

        Vehicle vehicle =
                vehicle(
                        input.vehicleId,
                        driver
                );

        BigDecimal fare =
                input.offeredFare
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        BigDecimal required =
                reserve(fare);

        require(
                available(
                        wallet(driver)
                ).compareTo(
                        required
                ) >= 0,
                "Insufficient available wallet balance",
                400
        );

        DriverOffer offer =
                findPending(
                        input.requestId,
                        input.driverId
                );

        if (offer == null) {
            offer =
                    new DriverOffer();

            offer.offerId =
                    UUID.randomUUID()
                            .toString();

            offer.requestId =
                    input.requestId;

            offer.driverId =
                    driver.driverId;

            offer.driverName =
                    driver.user.fullName;

            offer.status =
                    DriverOfferStatus.PENDING;

            offer.createdAt =
                    LocalDateTime.now();

            offers.put(
                    offer.offerId,
                    offer
            );
        }

        offer.vehicleId =
                vehicle.vehicleId;

        offer.vehicleDescription =
                vehicle.make +
                        " " +
                        vehicle.model;

        offer.plateNumber =
                vehicle.plateNumber;

        offer.offeredFare =
                fare;

        offer.requiredReserve =
                required;

        offer.updatedAt =
                LocalDateTime.now();

        return offer;
    }

    public List<DriverOffer>
    getOffersForRequest(
            String requestId
    ) {
        RideRequest request =
                rideRequestService
                        .getRideRequest(
                                requestId
                        );

        if (
                request.status !=
                        RideRequestStatus.SEARCHING
        ) {
            return List.of();
        }

        /*
         * Remove stale pending offers from
         * drivers who have since accepted
         * another ride.
         */
        withdrawBusyDriverOffers();

        return offers.values()
                .stream()
                .filter(
                        offer ->
                                offer.requestId
                                        .equals(
                                                requestId
                                        ) &&
                                        offer.status ==
                                                DriverOfferStatus
                                                        .PENDING
                )
                .sorted(
                        Comparator.comparing(
                                offer ->
                                        offer.offeredFare
                        )
                )
                .toList();
    }

    @Transactional
    public synchronized
    AcceptDriverOfferResponse acceptOffer(
            String offerId,
            AcceptDriverOfferRequest input
    ) {
        require(
                input != null &&
                        input.passengerId !=
                                null,
                "Passenger ID is required",
                400
        );

        DriverOffer offer =
                offers.get(offerId);

        require(
                offer != null,
                "Driver offer not found",
                404
        );

        require(
                offer.status ==
                        DriverOfferStatus.PENDING,
                "Offer is no longer available",
                409
        );

        RideRequest request =
                rideRequestService
                        .getRideRequest(
                                offer.requestId
                        );

        require(
                request.status ==
                        RideRequestStatus.SEARCHING,
                "Ride request is no longer available",
                409
        );

        require(
                request.passengerId.equals(
                        input.passengerId
                ),
                "Passenger cannot accept this offer",
                403
        );

        /*
         * The passenger cannot accept another
         * driver while already on an active ride.
         */
        activeRidePolicyService
                .requirePassengerAvailable(
                        input.passengerId
                );

        /*
         * The selected driver cannot be assigned
         * to two passengers.
         */
        activeRidePolicyService
                .requireDriverAvailable(
                        offer.driverId
                );

        Driver driver =
                driver(
                        offer.driverId
                );

        require(
                driver.driverStatus ==
                        DriverStatus.Online,
                "Driver is no longer available",
                409
        );

        Vehicle vehicle =
                vehicle(
                        offer.vehicleId,
                        driver
                );

        Wallet wallet =
                wallet(driver);

        BigDecimal required =
                reserve(
                        offer.offeredFare
                );

        require(
                available(wallet)
                        .compareTo(
                                required
                        ) >= 0,
                "Driver wallet balance is insufficient",
                400
        );

        wallet.reservedBalance =
                money(
                        wallet.reservedBalance
                )
                        .add(required)
                        .doubleValue();

        wallet.updatedAt =
                LocalDateTime.now();

        String pin =
                String.valueOf(
                        random.nextInt(
                                9000
                        ) + 1000
                );

        Ride ride =
                rideService
                        .createAcceptedRide(
                                request,
                                driver,
                                vehicle,
                                offer.offeredFare,
                                required,
                                hash(pin)
                        );

        driver.driverStatus =
                DriverStatus.Assigned;

        rideRequestService
                .markAccepted(
                        request.requestId
                );

        offer.status =
                DriverOfferStatus.ACCEPTED;

        offer.updatedAt =
                LocalDateTime.now();

        /*
         * Close every competing offer for the
         * accepted passenger request.
         *
         * Also withdraw this driver's offers
         * on every other passenger request.
         */
        offers.values()
                .stream()
                .filter(
                        otherOffer ->
                                !otherOffer.offerId
                                        .equals(
                                                offer.offerId
                                        ) &&
                                        otherOffer.status ==
                                                DriverOfferStatus
                                                        .PENDING
                )
                .forEach(
                        otherOffer -> {
                            if (
                                    otherOffer.requestId
                                            .equals(
                                                    request.requestId
                                            )
                            ) {
                                otherOffer.status =
                                        DriverOfferStatus
                                                .REJECTED;
                            } else if (
                                    otherOffer.driverId
                                            .equals(
                                                    driver.driverId
                                            )
                            ) {
                                otherOffer.status =
                                        DriverOfferStatus
                                                .WITHDRAWN;
                            }

                            if (
                                    otherOffer.status !=
                                            DriverOfferStatus
                                                    .PENDING
                            ) {
                                otherOffer.updatedAt =
                                        LocalDateTime.now();
                            }
                        }
                );

        return response(
                offer,
                ride,
                driver,
                vehicle,
                required,
                pin
        );
    }

    private void withdrawBusyDriverOffers() {
        offers.values()
                .stream()
                .filter(
                        offer ->
                                offer.status ==
                                        DriverOfferStatus
                                                .PENDING
                )
                .forEach(
                        offer -> {
                            if (
                                    activeRidePolicyService
                                            .driverHasActiveRide(
                                                    offer.driverId
                                            )
                            ) {
                                offer.status =
                                        DriverOfferStatus
                                                .WITHDRAWN;

                                offer.updatedAt =
                                        LocalDateTime.now();
                            }
                        }
                );
    }

    private AcceptDriverOfferResponse response(
            DriverOffer offer,
            Ride ride,
            Driver driver,
            Vehicle vehicle,
            BigDecimal reserve,
            String pin
    ) {
        AcceptDriverOfferResponse response =
                new AcceptDriverOfferResponse();

        response.success = true;

        response.message =
                "Driver offer accepted successfully";

        response.requestId =
                offer.requestId;

        response.offerId =
                offer.offerId;

        response.rideId =
                ride.rideId;

        response.status =
                ride.rideStatus.name();

        response.driverId =
                driver.driverId;

        response.driverName =
                driver.user.fullName;

        response.vehicleId =
                vehicle.vehicleId;

        response.vehicleDescription =
                vehicle.make +
                        " " +
                        vehicle.model;

        response.plateNumber =
                vehicle.plateNumber;

        response.acceptedFare =
                offer.offeredFare;

        response.reservedAmount =
                reserve;

        response.ridePin = pin;

        return response;
    }

    private void validate(
            SubmitDriverOfferRequest input
    ) {
        require(
                input != null,
                "Request body is required",
                400
        );

        require(
                input.requestId != null &&
                        !input.requestId
                                .isBlank(),
                "Request ID is required",
                400
        );

        require(
                input.driverId != null,
                "Driver ID is required",
                400
        );

        require(
                input.vehicleId != null,
                "Vehicle ID is required",
                400
        );

        require(
                input.offeredFare != null &&
                        input.offeredFare
                                .compareTo(
                                        BigDecimal.ZERO
                                ) > 0,
                "Offered fare must be positive",
                400
        );
    }

    private Driver driver(
            Integer driverId
    ) {
        Driver driver =
                driverRepository.findById(
                        driverId.longValue()
                );

        require(
                driver != null,
                "Driver not found",
                404
        );

        return driver;
    }

    private Vehicle vehicle(
            Integer vehicleId,
            Driver driver
    ) {
        Vehicle vehicle =
                vehicleRepository.findById(
                        vehicleId.longValue()
                );

        require(
                vehicle != null,
                "Vehicle not found",
                404
        );

        require(
                vehicle.driver != null &&
                        vehicle.driver.driverId
                                .equals(
                                        driver.driverId
                                ),
                "Vehicle does not belong to driver",
                400
        );

        return vehicle;
    }

    private Wallet wallet(
            Driver driver
    ) {
        Wallet wallet =
                walletRepository
                        .findByDriver(
                                driver
                        );

        require(
                wallet != null,
                "Driver wallet not found",
                404
        );

        return wallet;
    }

    private DriverOffer findPending(
            String requestId,
            Integer driverId
    ) {
        return offers.values()
                .stream()
                .filter(
                        offer ->
                                offer.requestId
                                        .equals(
                                                requestId
                                        ) &&
                                        offer.driverId
                                                .equals(
                                                        driverId
                                                ) &&
                                        offer.status ==
                                                DriverOfferStatus
                                                        .PENDING
                )
                .findFirst()
                .orElse(null);
    }

    private BigDecimal available(
            Wallet wallet
    ) {
        return money(
                wallet.balance
        ).subtract(
                money(
                        wallet.reservedBalance
                )
        );
    }

    private BigDecimal reserve(
            BigDecimal fare
    ) {
        return fare.multiply(
                RATE
        ).setScale(
                2,
                RoundingMode.HALF_UP
        );
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

            return HexFormat.of()
                    .formatHex(bytes);
        } catch (Exception error) {
            throw new WebApplicationException(
                    "Could not create ride PIN",
                    500
            );
        }
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