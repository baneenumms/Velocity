
package com.beni.resource;

import com.beni.dto.DriverRequest;
import com.beni.entity.Driver;
import com.beni.service.DriverService;
import java.util.List;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
        import jakarta.ws.rs.core.MediaType;

@Path("/drivers")
public class DriverResource {

    @Inject
    DriverService driverService;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Driver createDriver(DriverRequest request) {
        return driverService.createDriver(request);
    }
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<Driver> getAllDrivers() {
        return driverService.getAllDrivers();
    }
}