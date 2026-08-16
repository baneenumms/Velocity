package com.beni.resource;

import com.beni.dto.DriverProfileResponse;
import com.beni.dto.DriverStatusRequest;
import com.beni.dto.DriverStatusResponse;
import com.beni.dto.RideResponse;
import com.beni.dto.WalletResponse;
import com.beni.service.DriverService;
import com.beni.service.ResourceAuthorizationService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
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

    @Inject
    ResourceAuthorizationService authorizationService;

    /*
     * This endpoint must be POST /drivers/status.
     *
     * It matches the frontend fetch request exactly.
     */
    @POST
    @Path("/status")
    public DriverStatusResponse updateDriverStatus(
            DriverStatusRequest request,
            @HeaderParam("Authorization") String authorization
    ) {
        authorizationService.requireDriver(
                authorization,
                request == null ? null : request.driverId
        );

        return driverService.updateDriverStatus(
                request
        );
    }

    @GET
    @Path("/{driverId}/profile")
    public DriverProfileResponse getDriverProfile(
            @PathParam("driverId")
            Integer driverId,
            @HeaderParam("Authorization") String authorization
    ) {
        authorizationService.requireDriver(
                authorization,
                driverId
        );

        return driverService.getDriverProfile(
                driverId
        );
    }

    @GET
    @Path("/{driverId}/trips")
    public List<RideResponse> getTripHistory(
            @PathParam("driverId")
            Integer driverId,
            @HeaderParam("Authorization") String authorization
    ) {
        authorizationService.requireDriver(
                authorization,
                driverId
        );

        return driverService.getTripHistory(
                driverId
        );
    }

    @GET
    @Path("/{driverId}/wallet")
    public WalletResponse getWallet(
            @PathParam("driverId")
            Integer driverId,
            @HeaderParam("Authorization") String authorization
    ) {
        authorizationService.requireDriver(
                authorization,
                driverId
        );

        return driverService.getWallet(
                driverId
        );
    }
}
