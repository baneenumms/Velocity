package com.beni.resource;

import com.beni.dto.AdminFeedbackResponse;
import com.beni.service.AdminFeedbackService;
import com.beni.service.AdminSessionService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/admin/feedback")
@Produces(MediaType.APPLICATION_JSON)
public class AdminFeedbackResource {

    @Inject
    AdminSessionService
            adminSessionService;

    @Inject
    AdminFeedbackService
            adminFeedbackService;

    @GET
    public List<AdminFeedbackResponse>
    getAllFeedback(
            @HeaderParam("Authorization")
            String authorization
    ) {
        adminSessionService.requireAdmin(
                authorization
        );

        return adminFeedbackService
                .getAllFeedback();
    }

    @GET
    @Path("/{feedbackId}")
    public AdminFeedbackResponse
    getFeedback(
            @HeaderParam("Authorization")
            String authorization,

            @PathParam("feedbackId")
            Integer feedbackId
    ) {
        adminSessionService.requireAdmin(
                authorization
        );

        return adminFeedbackService
                .getFeedback(
                        feedbackId
                );
    }
}