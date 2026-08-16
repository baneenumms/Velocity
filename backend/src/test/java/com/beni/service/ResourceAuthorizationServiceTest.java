package com.beni.service;

import com.beni.entity.AuthSession;
import com.beni.entity.Driver;
import com.beni.entity.Passenger;
import com.beni.entity.Ride;
import com.beni.entity.User;
import com.beni.repository.DriverRepository;
import com.beni.repository.PassengerRepository;
import com.beni.repository.RideRepository;
import jakarta.ws.rs.WebApplicationException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ResourceAuthorizationServiceTest {

    @Test
    void allowsAuthenticatedDriverToUseOwnDriverId() {
        Fixture fixture = new Fixture("DRIVER");

        Driver result = fixture.service.requireDriver(
                "Bearer driver-token",
                fixture.driver.driverId
        );

        assertSame(fixture.driver, result);
    }

    @Test
    void rejectsAuthenticatedDriverUsingAnotherDriverId() {
        Fixture fixture = new Fixture("DRIVER");

        WebApplicationException error = assertThrows(
                WebApplicationException.class,
                () -> fixture.service.requireDriver(
                        "Bearer driver-token",
                        999
                )
        );

        assertEquals(
                403,
                error.getResponse().getStatus()
        );
    }

    @Test
    void rejectsAuthenticatedPassengerUsingAnotherPassengerId() {
        Fixture fixture = new Fixture("PASSENGER");

        WebApplicationException error = assertThrows(
                WebApplicationException.class,
                () -> fixture.service.requirePassenger(
                        "Bearer passenger-token",
                        999
                )
        );

        assertEquals(
                403,
                error.getResponse().getStatus()
        );
    }

    @Test
    void derivesDriverCancellationActorFromSession() {
        Fixture fixture = new Fixture("DRIVER");
        fixture.rideRepository.driverRide =
                fixture.ride;

        var participant =
                fixture.service
                        .requireRideParticipant(
                                "Bearer driver-token",
                                fixture.ride.rideId
                        );

        assertEquals("DRIVER", participant.role());
        assertEquals(
                fixture.driver.driverId,
                participant.driverId()
        );
        assertNull(participant.passengerId());
        assertSame(fixture.ride, participant.ride());
    }

    @Test
    void rejectsRideThatDoesNotBelongToAuthenticatedPassenger() {
        Fixture fixture = new Fixture("PASSENGER");
        fixture.rideRepository.passengerRide = null;

        WebApplicationException error = assertThrows(
                WebApplicationException.class,
                () -> fixture.service
                        .requirePassengerRide(
                                "Bearer passenger-token",
                                fixture.ride.rideId
                        )
        );

        assertEquals(
                403,
                error.getResponse().getStatus()
        );
    }

    private static final class Fixture {

        final User user = new User();
        final Driver driver = new Driver();
        final Passenger passenger = new Passenger();
        final Ride ride = new Ride();

        final StubSessionService sessionService =
                new StubSessionService();

        final StubDriverRepository driverRepository =
                new StubDriverRepository();

        final StubPassengerRepository passengerRepository =
                new StubPassengerRepository();

        final StubRideRepository rideRepository =
                new StubRideRepository();

        final ResourceAuthorizationService service =
                new ResourceAuthorizationService();

        Fixture(String mode) {
            user.userId = 10;

            driver.driverId = 20;
            driver.user = user;

            passenger.passengerId = 30;
            passenger.user = user;

            ride.rideId = 40;
            ride.driver = driver;
            ride.passenger = passenger;

            AuthSession session = new AuthSession();
            session.user = user;
            session.activeMode = mode;

            sessionService.session = session;
            driverRepository.driver = driver;
            passengerRepository.passenger = passenger;
            rideRepository.driverRide = ride;
            rideRepository.passengerRide = ride;

            service.sessionService = sessionService;
            service.driverRepository = driverRepository;
            service.passengerRepository =
                    passengerRepository;
            service.rideRepository = rideRepository;
        }
    }

    private static final class StubSessionService
            extends SessionService {

        AuthSession session;

        @Override
        public AuthSession requireValidSession(
                String authorizationHeader
        ) {
            return session;
        }

        @Override
        public AuthSession requireMode(
                String authorizationHeader,
                String mode
        ) {
            if (
                    session == null ||
                            session.activeMode == null ||
                            !session.activeMode
                                    .equalsIgnoreCase(mode)
            ) {
                throw new WebApplicationException(
                        "Wrong mode",
                        403
                );
            }

            return session;
        }
    }

    private static final class StubDriverRepository
            extends DriverRepository {

        Driver driver;

        @Override
        public Driver findByUser(User user) {
            return driver != null &&
                    driver.user == user
                    ? driver
                    : null;
        }
    }

    private static final class StubPassengerRepository
            extends PassengerRepository {

        Passenger passenger;

        @Override
        public Passenger findByUser(User user) {
            return passenger != null &&
                    passenger.user == user
                    ? passenger
                    : null;
        }
    }

    private static final class StubRideRepository
            extends RideRepository {

        Ride driverRide;
        Ride passengerRide;

        @Override
        public Ride findByIdAndDriverId(
                Integer rideId,
                Integer driverId
        ) {
            return driverRide != null &&
                    driverRide.rideId.equals(rideId) &&
                    driverRide.driver.driverId
                            .equals(driverId)
                    ? driverRide
                    : null;
        }

        @Override
        public Ride findByIdAndPassengerId(
                Integer rideId,
                Integer passengerId
        ) {
            return passengerRide != null &&
                    passengerRide.rideId.equals(rideId) &&
                    passengerRide.passenger.passengerId
                            .equals(passengerId)
                    ? passengerRide
                    : null;
        }
    }
}
