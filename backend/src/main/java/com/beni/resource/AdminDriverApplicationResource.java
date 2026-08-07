package com.beni.resource;

import com.beni.dto.AdminApproveDriverApplicationRequest;
import com.beni.dto.AdminDeclineDriverApplicationRequest;
import com.beni.dto.AdminDriverApplicationDecisionResponse;
import com.beni.dto.AdminDriverApplicationResponse;
import com.beni.entity.User;
import com.beni.service.AdminDriverApplicationService;
import com.beni.service.AdminSessionService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/admin/driver-applications")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AdminDriverApplicationResource {

    @Inject
    AdminSessionService adminSessionService;

    @Inject
    AdminDriverApplicationService applicationService;

    @GET
    public List<AdminDriverApplicationResponse> listApplications(
            @HeaderParam("Authorization")
            String authorizationHeader,

            @QueryParam("status")
            String status
    ) {
        User admin = adminSessionService.requireAdmin(
                authorizationHeader
        );

        return applicationService.listApplications(
                status,
                admin
        );
    }

    @GET
    @Path("/{applicationId}")
    public AdminDriverApplicationResponse getApplication(
            @HeaderParam("Authorization")
            String authorizationHeader,

            @PathParam("applicationId")
            Integer applicationId
    ) {
        User admin = adminSessionService.requireAdmin(
                authorizationHeader
        );

        return applicationService.getApplication(
                applicationId,
                admin
        );
    }

    @POST
    @Path("/{applicationId}/approve")
    public AdminDriverApplicationDecisionResponse approve(
            @HeaderParam("Authorization")
            String authorizationHeader,

            @PathParam("applicationId")
            Integer applicationId,

            AdminApproveDriverApplicationRequest request
    ) {
        User admin = adminSessionService.requireAdmin(
                authorizationHeader
        );

        return applicationService.approve(
                applicationId,
                request,
                admin
        );
    }

    @POST
    @Path("/{applicationId}/decline")
    public AdminDriverApplicationDecisionResponse decline(
            @HeaderParam("Authorization")
            String authorizationHeader,

            @PathParam("applicationId")
            Integer applicationId,

            AdminDeclineDriverApplicationRequest request
    ) {
        User admin = adminSessionService.requireAdmin(
                authorizationHeader
        );

        return applicationService.decline(
                applicationId,
                request,
                admin
        );
    }
}