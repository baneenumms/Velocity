package com.beni.riderequest;

import com.beni.dto.CreateRideRequest;
import com.beni.service.ActiveRidePolicyService;
import com.beni.service.SessionService;
import com.beni.entity.Driver;
import com.beni.entity.Passenger;
import com.beni.repository.DriverRepository;
import com.beni.repository.PassengerRepository;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/ride-requests")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class RideRequestResource {

    @Inject
    RideRequestService
            rideRequestService;

    @Inject
    ActiveRidePolicyService
            activeRidePolicyService;

    @Inject
    SessionService sessionService;

    @Inject
    PassengerRepository passengerRepository;

    @Inject
    DriverRepository driverRepository;

    @POST
    public RideRequest createRideRequest(
            CreateRideRequest request,
            @HeaderParam("Authorization") String authorization
    ) {
        requirePassenger(authorization, request.passengerId);
        return rideRequestService
                .createRideRequest(
                        request
                );
    }

    @GET
    @Path("/available")
    public List<RideRequest>
    getAvailableRideRequests(
            @QueryParam("driverId") Integer driverId,
            @HeaderParam("Authorization") String authorization
    ) {
        requireDriver(authorization, driverId);
        /*
         * Active drivers cannot retrieve
         * other ride requests.
         */
        activeRidePolicyService
                .requireDriverAvailable(
                        driverId
                );

        return rideRequestService
                .getAvailableRideRequests(driverId);
    }

    @GET
    @Path(
            "/passenger/{passengerId}/active"
    )
    public RideRequest
    getPassengerActiveRequest(
            @PathParam("passengerId")
            Integer passengerId,
            @HeaderParam("Authorization") String authorization
    ) {
        requirePassenger(authorization, passengerId);
        return rideRequestService
                .getPassengerActiveRequest(
                        passengerId
                );
    }

    @GET
    @Path("/{requestId}")
    public RideRequest getRideRequest(
            @PathParam("requestId")
            String requestId
    ) {
        return rideRequestService
                .getRideRequest(
                        requestId
                );
    }

    @PUT
    @Path("/{requestId}/fare")
    public RideRequest
    updatePassengerFare(
            @PathParam("requestId")
            String requestId,

            UpdateRideFareRequest request,
            @HeaderParam("Authorization") String authorization
    ) {
        requirePassenger(authorization, request.passengerId);
        return rideRequestService
                .updatePassengerFare(
                        requestId,
                        request
                );
    }

    @POST
    @Path("/{requestId}/cancel")
    public RideRequest
    cancelRideRequest(
            @PathParam("requestId")
            String requestId,

            @QueryParam("passengerId")
            Integer passengerId,
            @HeaderParam("Authorization") String authorization
    ) {
        requirePassenger(authorization, passengerId);
        return rideRequestService
                .cancelRideRequest(
                        requestId,
                        passengerId
                );
    }

    private void requirePassenger(String authorization, Integer passengerId) {
        var session = sessionService.requireMode(authorization, "PASSENGER");
        Passenger passenger = passengerRepository.findById(passengerId.longValue());
        if (passenger == null || !passenger.user.userId.equals(session.user.userId)) {
            throw new jakarta.ws.rs.WebApplicationException("Passenger session does not match this request.", 403);
        }
    }

    private void requireDriver(String authorization, Integer driverId) {
        var session = sessionService.requireMode(authorization, "DRIVER");
        Driver driver = driverRepository.findById(driverId.longValue());
        if (driver == null || !driver.user.userId.equals(session.user.userId)) {
            throw new jakarta.ws.rs.WebApplicationException("Driver session does not match this request.", 403);
        }
    }
}
