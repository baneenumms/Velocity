package com.beni.resource;

import com.beni.dto.EstimateRideRequest;
import com.beni.dto.EstimateRideResponse;
import com.beni.dto.PassengerTripResponse;
import com.beni.dto.RideStatusResponse;
import com.beni.dto.StartRideRequest;
import com.beni.service.ResourceAuthorizationService;
import com.beni.service.RideService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/rides")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class RideResource {

    @Inject
    RideService rideService;

    @Inject
    ResourceAuthorizationService authorizationService;

    @POST
    @Path("/estimate")
    public EstimateRideResponse estimate(
            EstimateRideRequest request
    ) {
        return rideService.estimateRide(request);
    }

    @GET
    @Path("/passenger/{passengerId}/history")
    public List<PassengerTripResponse> passengerHistory(
            @PathParam("passengerId") Integer passengerId,
            @HeaderParam("Authorization") String authorization
    ) {
        authorizationService.requirePassenger(
                authorization,
                passengerId
        );

        return rideService.getPassengerTripHistory(
                passengerId
        );
    }

    @POST
    @Path("/{rideId}/start")
    public RideStatusResponse start(
            @PathParam("rideId") Integer rideId,
            StartRideRequest request,
            @HeaderParam("Authorization") String authorization
    ) {
        authorizationService.requireDriverRide(
                authorization,
                rideId
        );

        return rideService.startRide(
                rideId,
                request
        );
    }

    @POST
    @Path("/{rideId}/complete")
    public RideStatusResponse complete(
            @PathParam("rideId") Integer rideId,
            @HeaderParam("Authorization") String authorization
    ) {
        authorizationService.requireDriverRide(
                authorization,
                rideId
        );

        return rideService.completeRide(rideId);
    }

    @POST
    @Path("/{rideId}/cancel")
    public RideStatusResponse cancel(
            @PathParam("rideId") Integer rideId,
            @QueryParam("reason") String reason,
            @HeaderParam("Authorization") String authorization
    ) {
        var participant =
                authorizationService.requireRideParticipant(
                        authorization,
                        rideId
                );

        return rideService.cancelRide(
                rideId,
                participant.role(),
                reason
        );
    }
}
