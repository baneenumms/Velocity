package com.beni.resource;

import com.beni.dto.PassengerRideResponse;
import com.beni.service.PassengerRideService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/passenger-rides")
@Produces(MediaType.APPLICATION_JSON)
public class PassengerRideResource {

    @Inject
    PassengerRideService passengerRideService;

    @GET
    @Path("/{passengerId}/latest")
    public PassengerRideResponse getLatestRide(
            @PathParam("passengerId")
            Integer passengerId
    ) {
        return passengerRideService.getLatestRide(
                passengerId
        );
    }
}
