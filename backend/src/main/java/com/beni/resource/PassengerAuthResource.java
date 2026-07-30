package com.beni.resource;

import com.beni.dto.CheckPhoneRequest;
import com.beni.dto.PassengerSignupRequest;
import com.beni.dto.PassengerSignupVerifyRequest;
import com.beni.dto.PhoneCheckResponse;
import com.beni.dto.SendOtpResponse;
import com.beni.dto.VerifyOTPRequest;
import com.beni.dto.VerifyOtpResponse;
import com.beni.service.PassengerAuthService;
import com.beni.service.PassengerRegistrationService;
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

    @Inject
    PassengerRegistrationService
            passengerRegistrationService;

    /*
     * Existing registered-passenger login flow.
     */
    @POST
    @Path("/check-phone")
    public PhoneCheckResponse checkPhone(
            CheckPhoneRequest request
    ) {
        return passengerAuthService.checkPhone(
                request.phoneNumber
        );
    }

    /*
     * Existing registered-passenger OTP login.
     */
    @POST
    @Path("/verify-otp")
    public VerifyOtpResponse verifyOtp(
            VerifyOTPRequest request
    ) {
        return passengerAuthService.verifyOtp(
                request.phoneNumber,
                request.otp
        );
    }

    /*
     * New passenger-signup OTP endpoint.
     * This does not create an account.
     */
    @POST
    @Path("/signup/send-otp")
    public SendOtpResponse sendSignupOtp(
            PassengerSignupRequest request
    ) {
        return passengerRegistrationService
                .sendSignupOtp(request);
    }

    /*
     * Verifies the signup OTP and creates the
     * user/passenger records together.
     */
    @POST
    @Path("/signup/verify-otp")
    public VerifyOtpResponse verifySignupOtp(
            PassengerSignupVerifyRequest request
    ) {
        return passengerRegistrationService
                .verifySignupOtp(request);
    }
}