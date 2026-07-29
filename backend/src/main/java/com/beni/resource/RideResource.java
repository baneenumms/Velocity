package com.beni.resource;

import com.beni.dto.EstimateRideRequest;
import com.beni.dto.EstimateRideResponse;
import com.beni.dto.PassengerTripResponse;
import com.beni.dto.RideStatusResponse;
import com.beni.dto.StartRideRequest;
import com.beni.service.RideService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
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
            @PathParam("passengerId") Integer passengerId
    ) {
        return rideService.getPassengerTripHistory(
                passengerId
        );
    }

    @POST
    @Path("/{rideId}/start")
    public RideStatusResponse start(
            @PathParam("rideId") Integer rideId,
            StartRideRequest request
    ) {
        return rideService.startRide(
                rideId,
                request
        );
    }

    @POST
    @Path("/{rideId}/complete")
    public RideStatusResponse complete(
            @PathParam("rideId") Integer rideId
    ) {
        return rideService.completeRide(rideId);
    }

    @POST
    @Path("/{rideId}/cancel")
    public RideStatusResponse cancel(
            @PathParam("rideId") Integer rideId,
            @QueryParam("cancelledBy") String cancelledBy,
            @QueryParam("reason") String reason
    ) {
        return rideService.cancelRide(
                rideId,
                cancelledBy,
                reason
        );
    }
}