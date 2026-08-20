package com.beni.riderequest;

import com.beni.entity.Driver;
import com.beni.entity.DriverStatus;
import com.beni.entity.Ride;
import com.beni.entity.Vehicle;
import com.beni.entity.Wallet;
import com.beni.repository.DriverRepository;
import com.beni.repository.PassengerRepository;
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
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class DriverOfferService {

    private static final BigDecimal RATE =
            new BigDecimal("0.12");

    private final SecureRandom random =
            new SecureRandom();

    @Inject
    RideRequestService rideRequestService;

    @Inject
    DriverOfferRepository driverOfferRepository;

    @Inject
    DriverRepository driverRepository;

    @Inject
    VehicleRepository vehicleRepository;

    @Inject
    WalletRepository walletRepository;

    @Inject
    PassengerRepository passengerRepository;

    @Inject
    RideService rideService;

    @Inject
    ActiveRidePolicyService activeRidePolicyService;

    @Transactional
    public DriverOffer submitOffer(
            SubmitDriverOfferRequest input
    ) {
        validate(input);

        /*
         * Every submit/accept path uses the same
         * lock order: wallet, request, offer.
         * This serializes work by driver and by
         * passenger request across app instances.
         */
        Wallet wallet =
                lockedWallet(input.driverId);

        activeRidePolicyService
                .requireDriverAvailable(
                        input.driverId
                );

        RideRequest request =
                rideRequestService
                        .getRideRequestForUpdate(
                                input.requestId
                        );

        require(
                request.status ==
                        RideRequestStatus.SEARCHING,
                "Ride request is no longer available",
                409
        );

        Driver driver =
                driver(input.driverId);

        requireNotOwnRide(request, driver);

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
                available(wallet)
                        .compareTo(required) >= 0,
                "Insufficient available wallet balance",
                400
        );

        DriverOffer offer =
                driverOfferRepository
                        .findPendingForUpdate(
                                input.requestId,
                                input.driverId
                        );

        boolean newOffer =
                offer == null;

        LocalDateTime now =
                LocalDateTime.now();

        if (offer == null) {
            offer = new DriverOffer();
            offer.offerId =
                    UUID.randomUUID().toString();
            offer.requestId =
                    input.requestId;
            offer.driverId =
                    driver.driverId;
            offer.driverName =
                    driver.user.fullName;
            offer.status =
                    DriverOfferStatus.PENDING;
            offer.createdAt = now;
        }

        offer.vehicleId =
                vehicle.vehicleId;
        offer.vehicleDescription =
                vehicle.make + " " + vehicle.model;
        offer.plateNumber =
                vehicle.plateNumber;
        offer.offeredFare = fare;
        offer.requiredReserve = required;
        offer.updatedAt = now;

        if (newOffer) {
            driverOfferRepository.persist(offer);
        }

        return offer;
    }

    @Transactional
    public List<DriverOffer> getOffersForRequest(
            String requestId
    ) {
        RideRequest request =
                rideRequestService
                        .getRideRequest(requestId);

        if (
                request.status !=
                        RideRequestStatus.SEARCHING
        ) {
            return List.of();
        }

        /*
         * Pending offers from a driver who has
         * since taken another ride are stale.
         */
        withdrawBusyDriverOffers();

        return driverOfferRepository
                .listVisibleByRequest(
                        requestId,
                        LocalDateTime.now()
                );
    }

    @Transactional
    public List<DriverOffer> getPendingOffersForDriver(
            Integer driverId
    ) {
        require(
                driverId != null &&
                        driverId > 0,
                "Driver ID is required",
                400
        );

        driver(driverId);

        /*
         * Remove offers that became stale because
         * their driver accepted another ride, then
         * return only offers whose request is still
         * searchable and has not expired.
         */
        withdrawBusyDriverOffers();

        return driverOfferRepository
                .listPendingByDriver(
                        driverId,
                        LocalDateTime.now()
                );
    }

    @Transactional
    public DriverOffer cancelPendingOffer(
            String offerId,
            Integer driverId
    ) {
        require(
                offerId != null &&
                        !offerId.isBlank(),
                "Offer ID is required",
                400
        );

        require(
                driverId != null &&
                        driverId > 0,
                "Driver ID is required",
                400
        );

        DriverOffer offer =
                driverOfferRepository
                        .findByOfferIdForUpdate(
                                offerId
                        );

        require(
                offer != null,
                "Driver offer not found",
                404
        );

        require(
                driverId.equals(
                        offer.driverId
                ),
                "This offer does not belong to the authenticated driver",
                403
        );

        require(
                offer.status ==
                        DriverOfferStatus.PENDING,
                "Only pending offers can be cancelled",
                409
        );

        offer.status =
                DriverOfferStatus.WITHDRAWN;

        offer.updatedAt =
                LocalDateTime.now();

        return offer;
    }

    @Transactional
    public AcceptDriverOfferResponse acceptOffer(
            String offerId,
            AcceptDriverOfferRequest input
    ) {
        require(
                input != null &&
                        input.passengerId != null,
                "Passenger ID is required",
                400
        );

        DriverOfferRepository.OfferIdentity identity =
                driverOfferRepository
                        .findIdentity(offerId);

        require(
                identity != null,
                "Driver offer not found",
                404
        );

        /*
         * Read only scalar IDs above. Do not load
         * the offer entity before its turn in the
         * shared wallet -> request -> offer order.
         */
        Wallet wallet =
                lockedWallet(identity.driverId());

        RideRequest request =
                rideRequestService
                        .getRideRequestForUpdate(
                                identity.requestId()
                        );

        DriverOffer offer =
                driverOfferRepository
                        .findByOfferIdForUpdate(offerId);

        require(
                offer != null,
                "Driver offer not found",
                404
        );

        require(
                identity.requestId()
                                .equals(offer.requestId) &&
                        identity.driverId()
                                .equals(offer.driverId),
                "Offer changed while it was being accepted",
                409
        );

        require(
                offer.status ==
                        DriverOfferStatus.PENDING,
                "Offer is no longer available",
                409
        );

        require(
                request.status ==
                        RideRequestStatus.SEARCHING,
                "Ride request is no longer available",
                409
        );

        require(
                request.passengerId
                        .equals(input.passengerId),
                "Passenger cannot accept this offer",
                403
        );

        activeRidePolicyService
                .requirePassengerAvailable(
                        input.passengerId
                );

        activeRidePolicyService
                .requireDriverAvailable(
                        offer.driverId
                );

        Driver driver =
                driver(offer.driverId);

        requireNotOwnRide(request, driver);

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

        BigDecimal required =
                reserve(offer.offeredFare);

        require(
                available(wallet)
                        .compareTo(required) >= 0,
                "Driver wallet balance is insufficient",
                400
        );

        wallet.reservedBalance =
                money(wallet.reservedBalance)
                        .add(required);
        wallet.updatedAt =
                LocalDateTime.now();

        String pin =
                String.valueOf(
                        random.nextInt(9000) + 1000
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

        request.status =
                RideRequestStatus.ACCEPTED;

        offer.status =
                DriverOfferStatus.ACCEPTED;

        LocalDateTime now =
                LocalDateTime.now();

        offer.updatedAt = now;

        driverOfferRepository
                .rejectCompetingOffers(
                        request.requestId,
                        offer.offerId,
                        now
                );

        driverOfferRepository
                .withdrawOtherDriverOffers(
                        driver.driverId,
                        offer.offerId,
                        now
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
        Set<Integer> checkedDrivers =
                new HashSet<>();

        for (
                DriverOffer offer :
                driverOfferRepository.listPending()
        ) {
            if (!checkedDrivers.add(offer.driverId)) {
                continue;
            }

            if (
                    activeRidePolicyService
                            .driverHasActiveRide(
                                    offer.driverId
                            )
            ) {
                driverOfferRepository
                        .withdrawPendingByDriver(
                                offer.driverId,
                                LocalDateTime.now()
                        );
            }
        }
    }

    private void requireNotOwnRide(
            RideRequest request,
            Driver driver
    ) {
        var passenger =
                passengerRepository.findById(
                        request.passengerId.longValue()
                );

        require(
                passenger != null,
                "Passenger not found",
                404
        );

        require(
                !passenger.user.userId
                        .equals(driver.user.userId),
                "You cannot send or accept an offer for your own ride.",
                403
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
                vehicle.make + " " + vehicle.model;
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
                        !input.requestId.isBlank(),
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
                                .equals(driver.driverId),
                "Vehicle does not belong to driver",
                400
        );

        return vehicle;
    }

    private Wallet lockedWallet(
            Integer driverId
    ) {
        Wallet wallet =
                walletRepository
                        .findByDriverIdForUpdate(
                                driverId
                        );

        require(
                wallet != null,
                "Driver wallet not found",
                404
        );

        return wallet;
    }

    private BigDecimal available(
            Wallet wallet
    ) {
        return money(wallet.balance)
                .subtract(
                        money(wallet.reservedBalance)
                );
    }

    private BigDecimal reserve(
            BigDecimal fare
    ) {
        return fare.multiply(RATE)
                .setScale(
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

    private String hash(
            String value
    ) {
        try {
            byte[] bytes =
                    MessageDigest
                            .getInstance("SHA-256")
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
