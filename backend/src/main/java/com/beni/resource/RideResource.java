package com.beni.resource;

import com.beni.dto.AcceptRideRequest;
import com.beni.dto.CreateRideRequest;
import com.beni.dto.CreateRideResponse;
import com.beni.dto.EstimateRideRequest;
import com.beni.dto.EstimateRideResponse;
import com.beni.dto.RideStatusResponse;
import com.beni.service.RideService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/rides")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class RideResource {

    @Inject
    RideService rideService;

    @POST
    @Path("/estimate")
    public EstimateRideResponse estimateRide(
            EstimateRideRequest request
    ) {
        return rideService.estimateRide(request);
    }

    @POST
    @Path("/create")
    public CreateRideResponse createRide(
            CreateRideRequest request
    ) {
        return rideService.createRide(request);
    }

    @POST
    @Path("/accept")
    public RideStatusResponse acceptRide(
            AcceptRideRequest request
    ) {
        return rideService.acceptRide(request);
    }

    @POST
    @Path("/{rideId}/start")
    public RideStatusResponse startRide(
            @PathParam("rideId") Integer rideId
    ) {
        return rideService.startRide(rideId);
    }

    @POST
    @Path("/{rideId}/complete")
    public RideStatusResponse completeRide(
            @PathParam("rideId") Integer rideId
    ) {
        return rideService.completeRide(rideId);
    }

    @POST
    @Path("/{rideId}/cancel")
    public RideStatusResponse cancelRide(
            @PathParam("rideId") Integer rideId
    ) {
        return rideService.cancelRide(rideId);
    }
}