package com.beni.riderequest;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/driver-offers")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class DriverOfferResource {

    @Inject
    DriverOfferService driverOfferService;

    @POST
    public DriverOffer submitOffer(
            SubmitDriverOfferRequest request
    ) {
        return driverOfferService.submitOffer(
                request
        );
    }

    @GET
    @Path("/request/{requestId}")
    public List<DriverOffer> getOffersForRequest(
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
    public AcceptDriverOfferResponse acceptOffer(
            @PathParam("offerId")
            String offerId,

            AcceptDriverOfferRequest request
    ) {
        return driverOfferService.acceptOffer(
                offerId,
                request
        );
    }
}