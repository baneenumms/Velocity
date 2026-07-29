package com.beni.resource;

import com.beni.dto.DriverActiveRideResponse;
import com.beni.service.DriverRideService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/driver-rides")
@Produces(MediaType.APPLICATION_JSON)
public class DriverRideResource {

    @Inject
    DriverRideService driverRideService;

    @GET
    @Path("/{driverId}/active")
    public DriverActiveRideResponse getActiveRide(
            @PathParam("driverId")
            Integer driverId
    ) {
        return driverRideService.getActiveRide(
                driverId
        );
    }
}