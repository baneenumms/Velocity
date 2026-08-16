package com.beni.resource;
import com.beni.dto.DriverApplicationCorrectionFormResponse;
import com.beni.dto.DriverApplicationResubmitRequest;
import com.beni.dto.DriverApplicationStatusResponse;
import com.beni.dto.DriverSignupRequest;
import com.beni.dto.DriverSignupStartResponse;
import com.beni.dto.DriverSignupVerifyRequest;
import com.beni.dto.VehicleCatalogResponse;
import com.beni.entity.User;
import com.beni.service.DriverApplicantSessionService;
import com.beni.service.DriverApplicationResubmissionService;
import com.beni.service.DriverRegistrationService;
import com.beni.service.VehicleCatalogService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@Path("/driver-registration")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class DriverRegistrationResource {

    @Inject
    DriverRegistrationService registrationService;

    @Inject
    DriverApplicationResubmissionService
            resubmissionService;

    @Inject
    DriverApplicantSessionService applicantSessionService;

    @Inject
    VehicleCatalogService vehicleCatalogService;

    @GET
    @Path("/vehicle-options")
    public VehicleCatalogResponse getVehicleOptions() {
        return vehicleCatalogService.getOptions();
    }

    @POST
    @Path("/signup/send-otp")
    public DriverSignupStartResponse sendSignupOtp(
            DriverSignupRequest request
    ) {
        return registrationService.startSignup(
                request
        );
    }

    @POST
    @Path("/signup/verify-otp")
    public DriverApplicationStatusResponse verifySignupOtp(
            DriverSignupVerifyRequest request
    ) {
        return registrationService.verifySignup(
                request
        );
    }

    @GET
    @Path("/application/status")
    public DriverApplicationStatusResponse getApplicationStatus(
            @HeaderParam("Authorization")
            String authorizationHeader
    ) {
        User user =
                applicantSessionService.requireApplicant(
                        authorizationHeader
                );

        return registrationService.getCurrentStatus(
                user
        );
    }

    @GET
    @Path("/application/correction-form")
    public DriverApplicationCorrectionFormResponse
    getCorrectionForm(
            @HeaderParam("Authorization")
            String authorizationHeader
    ) {
        User user =
                applicantSessionService.requireApplicant(
                        authorizationHeader
                );

        return resubmissionService.getCorrectionForm(
                user
        );
    }

    @POST
    @Path("/application/resubmit")
    public DriverApplicationStatusResponse resubmitApplication(
            @HeaderParam("Authorization")
            String authorizationHeader,
            DriverApplicationResubmitRequest request
    ) {
        User user =
                applicantSessionService.requireApplicant(
                        authorizationHeader
                );

        return resubmissionService.resubmit(
                user,
                request
        );
    }

    @POST
    @Path("/logout")
    public Response logout(
            @HeaderParam("Authorization")
            String authorizationHeader
    ) {
        applicantSessionService.revokeSession(
                authorizationHeader
        );

        return Response.ok(
                Map.of(
                        "success",
                        true,
                        "message",
                        "Applicant session ended"
                )
        ).build();
    }
}
