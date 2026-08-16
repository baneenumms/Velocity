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
import com.beni.service.ResourceAuthorizationService;

@Path("/driver-offers")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class DriverOfferResource {

    @Inject
    DriverOfferService
            driverOfferService;

    @Inject
    ResourceAuthorizationService authorizationService;

    @Inject
    RideRequestService rideRequestService;

    @POST
    public DriverOffer submitOffer(
            SubmitDriverOfferRequest request,
            @HeaderParam("Authorization") String authorization
    ) {
        authorizationService.requireDriver(
                authorization,
                request == null ? null : request.driverId
        );

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
            String requestId,
            @HeaderParam("Authorization") String authorization
    ) {
        RideRequest rideRequest =
                rideRequestService.getRideRequest(requestId);

        authorizationService.requirePassenger(
                authorization,
                rideRequest.passengerId
        );

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
        authorizationService.requirePassenger(
                authorization,
                request == null ? null : request.passengerId
        );

        return driverOfferService
                .acceptOffer(
                        offerId,
                        request
                );
    }

}
