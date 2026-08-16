package com.beni.resource;

import com.beni.dto.PassengerRideResponse;
import com.beni.service.PassengerRideService;
import com.beni.service.ResourceAuthorizationService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/passenger-rides")
@Produces(MediaType.APPLICATION_JSON)
public class PassengerRideResource {

    @Inject
    PassengerRideService passengerRideService;

    @Inject
    ResourceAuthorizationService authorizationService;

    @GET
    @Path("/{passengerId}/latest")
    public PassengerRideResponse getLatestRide(
            @PathParam("passengerId")
            Integer passengerId,
            @HeaderParam("Authorization") String authorization
    ) {
        authorizationService.requirePassenger(
                authorization,
                passengerId
        );

        return passengerRideService.getLatestRide(
                passengerId
        );
    }
}
