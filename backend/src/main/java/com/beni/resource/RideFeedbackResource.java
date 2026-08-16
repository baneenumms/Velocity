package com.beni.resource;

import com.beni.dto.*;
import com.beni.service.ResourceAuthorizationService;
import com.beni.service.RideFeedbackService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/ride-feedback")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class RideFeedbackResource {

    @Inject
    RideFeedbackService feedbackService;

    @Inject
    ResourceAuthorizationService authorizationService;

    @POST
    public RideFeedbackResponse submit(
            RideFeedbackRequest request,
            @HeaderParam("Authorization") String authorization
    ) {
        if (request == null) {
            throw new BadRequestException(
                    "Request body is required."
            );
        }

        var participant =
                authorizationService.requireRideParticipant(
                        authorization,
                        request.rideId
                );

        request.submittedBy = participant.role();
        request.passengerId = participant.passengerId();
        request.driverId = participant.driverId();

        return feedbackService.submit(request);
    }
}
