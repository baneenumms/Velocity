package com.beni.riderequest;

import com.beni.dto.CreateRideRequest;
import com.beni.dto.RideRequestAvailabilityResponse;
import com.beni.service.ActiveRidePolicyService;
import com.beni.service.ResourceAuthorizationService;
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
    ResourceAuthorizationService authorizationService;

    @POST
    public RideRequest createRideRequest(
            CreateRideRequest request,
            @HeaderParam("Authorization") String authorization
    ) {
        authorizationService.requirePassenger(
                authorization,
                request == null ? null : request.passengerId
        );

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
        authorizationService.requireDriver(
                authorization,
                driverId
        );

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
        authorizationService.requirePassenger(
                authorization,
                passengerId
        );

        return rideRequestService
                .getPassengerActiveRequest(
                        passengerId
                );
    }

    @GET
    @Path("/{requestId}")
    public RideRequest getRideRequest(
            @PathParam("requestId")
            String requestId,
            @HeaderParam("Authorization") String authorization
    ) {
        RideRequest request = rideRequestService
                .getRideRequest(requestId);

        authorizationService.requirePassenger(
                authorization,
                request.passengerId
        );

        return request;
    }

    @GET
    @Path("/{requestId}/availability")
    public RideRequestAvailabilityResponse getAvailability(
            @PathParam("requestId") String requestId,
            @HeaderParam("Authorization") String authorization
    ) {
        RideRequest request = rideRequestService.getRideRequest(requestId);
        authorizationService.requirePassenger(authorization, request.passengerId);
        return new RideRequestAvailabilityResponse(
                (int) rideRequestService.onlineDriverCountForRequest(requestId)
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
        authorizationService.requirePassenger(
                authorization,
                request == null ? null : request.passengerId
        );

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
        authorizationService.requirePassenger(
                authorization,
                passengerId
        );

        return rideRequestService
                .cancelRideRequest(
                        requestId,
                        passengerId
                );
    }

}
