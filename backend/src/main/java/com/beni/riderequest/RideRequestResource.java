package com.beni.riderequest;

import com.beni.dto.CreateRideRequest;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/ride-requests")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class RideRequestResource {

    @Inject
    RideRequestService rideRequestService;

    @POST
    public RideRequest createRideRequest(
            CreateRideRequest request
    ) {
        return rideRequestService
                .createRideRequest(
                        request
                );
    }

    @GET
    @Path("/available")
    public List<RideRequest>
    getAvailableRideRequests() {

        return rideRequestService
                .getAvailableRideRequests();
    }

    @GET
    @Path("/passenger/{passengerId}/active")
    public RideRequest getPassengerActiveRequest(
            @PathParam("passengerId")
            Integer passengerId
    ) {
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
    public RideRequest updatePassengerFare(
            @PathParam("requestId")
            String requestId,

            UpdateRideFareRequest request
    ) {
        return rideRequestService
                .updatePassengerFare(
                        requestId,
                        request
                );
    }

    @POST
    @Path("/{requestId}/cancel")
    public RideRequest cancelRideRequest(
            @PathParam("requestId")
            String requestId,

            @QueryParam("passengerId")
            Integer passengerId
    ) {
        return rideRequestService
                .cancelRideRequest(
                        requestId,
                        passengerId
                );
    }
}