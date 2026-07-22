package com.beni.resource;

import com.beni.dto.CheckPhoneRequest;
import com.beni.dto.PhoneCheckResponse;
import com.beni.dto.VerifyOTPRequest;
import com.beni.dto.VerifyOtpResponse;
import com.beni.service.PassengerAuthService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/passenger-auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class PassengerAuthResource {

    @Inject
    PassengerAuthService passengerAuthService;

    @POST
    @Path("/check-phone")
    public PhoneCheckResponse checkPhone(CheckPhoneRequest request) {
        return passengerAuthService.checkPhone(request.phoneNumber);
    }

    @POST
    @Path("/verify-otp")
    public VerifyOtpResponse verifyOtp(VerifyOTPRequest request) {
        return passengerAuthService.verifyOtp(
                request.phoneNumber,
                request.otp
        );
    }
}