package com.beni.resource;

import com.beni.dto.DriverProfileResponse;
import com.beni.dto.DriverRequest;
import com.beni.dto.DriverStatusResponse;
import com.beni.dto.RideResponse;
import com.beni.dto.UpdateDriverStatusRequest;
import com.beni.dto.WalletResponse;
import com.beni.entity.Driver;
import com.beni.service.DriverService;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
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
    @Transactional
    public Driver createDriver(DriverRequest request) {
        return driverService.createDriver(request);
    }

    @GET
    public List<Driver> getAllDrivers() {
        return driverService.getAllDrivers();
    }

    @PATCH
    @Path("/status")
    @Transactional
    public DriverStatusResponse updateDriverStatus(UpdateDriverStatusRequest request) {
        return driverService.updateDriverStatus(request.driverId, request.status);
    }

    @GET
    @Path("/profile/{driverId}")
    public DriverProfileResponse getDriverProfile(@PathParam("driverId") Integer driverId) {
        return driverService.getDriverProfile(driverId);
    }

    @GET
    @Path("/wallet/{driverId}")
    public WalletResponse getWallet(@PathParam("driverId") Integer driverId) {
        return driverService.getWallet(driverId);
    }

    @GET
    @Path("/trips/{driverId}")
    public List<RideResponse> getTripHistory(@PathParam("driverId") Integer driverId) {
        return driverService.getTripHistory(driverId);
    }
}