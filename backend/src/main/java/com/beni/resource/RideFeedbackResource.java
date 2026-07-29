package com.beni.resource;

import com.beni.dto.*;
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

    @POST
    public RideFeedbackResponse submit(
            RideFeedbackRequest request
    ) {
        return feedbackService.submit(request);
    }
}