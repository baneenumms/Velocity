package com.beni.riderequest;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import com.beni.entity.Driver;
import com.beni.entity.Passenger;
import com.beni.repository.DriverRepository;
import com.beni.repository.PassengerRepository;
import com.beni.service.SessionService;

@Path("/driver-offers")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class DriverOfferResource {

    @Inject
    DriverOfferService
            driverOfferService;

    @Inject
    SessionService sessionService;

    @Inject
    DriverRepository driverRepository;

    @Inject
    PassengerRepository passengerRepository;

    @POST
    public DriverOffer submitOffer(
            SubmitDriverOfferRequest request,
            @HeaderParam("Authorization") String authorization
    ) {
        requireDriver(authorization, request.driverId);
        return driverOfferService
                .submitOffer(
                        request
                );
    }

    @GET
    @Path("/request/{requestId}")
    public List<DriverOffer>
    getOffersForRequest(
            @PathParam("requestId")
            String requestId
    ) {
        return driverOfferService
                .getOffersForRequest(
                        requestId
                );
    }

    @POST
    @Path("/{offerId}/accept")
    public AcceptDriverOfferResponse
    acceptOffer(
            @PathParam("offerId")
            String offerId,

            AcceptDriverOfferRequest request,
            @HeaderParam("Authorization") String authorization
    ) {
        requirePassenger(authorization, request.passengerId);
        return driverOfferService
                .acceptOffer(
                        offerId,
                        request
                );
    }

    private void requireDriver(String authorization, Integer driverId) {
        var session = sessionService.requireMode(authorization, "DRIVER");
        Driver driver = driverRepository.findById(driverId.longValue());
        if (driver == null || !driver.user.userId.equals(session.user.userId)) {
            throw new jakarta.ws.rs.WebApplicationException("Driver session does not match this offer.", 403);
        }
    }

    private void requirePassenger(String authorization, Integer passengerId) {
        var session = sessionService.requireMode(authorization, "PASSENGER");
        Passenger passenger = passengerRepository.findById(passengerId.longValue());
        if (passenger == null || !passenger.user.userId.equals(session.user.userId)) {
            throw new jakarta.ws.rs.WebApplicationException("Passenger session does not match this offer.", 403);
        }
    }
}
