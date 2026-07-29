package com.beni.resource;

import com.beni.dto.DriverProfileResponse;
import com.beni.dto.DriverRequest;
import com.beni.dto.DriverStatusRequest;
import com.beni.dto.DriverStatusResponse;
import com.beni.dto.RideResponse;
import com.beni.dto.WalletResponse;
import com.beni.entity.Driver;
import com.beni.service.DriverService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/drivers")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class DriverResource {

    @Inject
    DriverService driverService;

    @POST
    public Driver createDriver(
            DriverRequest request
    ) {
        return driverService.createDriver(request);
    }

    @GET
    public List<Driver> getAllDrivers() {
        return driverService.getAllDrivers();
    }

    /*
     * This endpoint must be POST /drivers/status.
     *
     * It matches the frontend fetch request exactly.
     */
    @POST
    @Path("/status")
    public DriverStatusResponse updateDriverStatus(
            DriverStatusRequest request
    ) {
        return driverService.updateDriverStatus(
                request
        );
    }

    @GET
    @Path("/user/{userId}")
    public Driver getDriverByUserId(
            @PathParam("userId")
            Integer userId
    ) {
        return driverService.getDriverByUserId(
                userId
        );
    }

    @GET
    @Path("/{driverId}/profile")
    public DriverProfileResponse getDriverProfile(
            @PathParam("driverId")
            Integer driverId
    ) {
        return driverService.getDriverProfile(
                driverId
        );
    }

    @GET
    @Path("/{driverId}/trips")
    public List<RideResponse> getTripHistory(
            @PathParam("driverId")
            Integer driverId
    ) {
        return driverService.getTripHistory(
                driverId
        );
    }

    @GET
    @Path("/{driverId}/wallet")
    public WalletResponse getWallet(
            @PathParam("driverId")
            Integer driverId
    ) {
        return driverService.getWallet(
                driverId
        );
    }
}