package com.beni.resource;

import com.beni.dto.CheckPhoneRequest;
import com.beni.dto.DriverAuthRequest;
import com.beni.dto.LoginRequest;
import com.beni.dto.LoginResponse;
import com.beni.dto.PhoneCheckResponse;
import com.beni.dto.SendOtpRequest;
import com.beni.dto.SendOtpResponse;
import com.beni.dto.VerifyOTPRequest;
import com.beni.dto.VerifyOtpResponse;
import com.beni.entity.DriverAuth;
import com.beni.service.DriverAuthService;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/driver-auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class DriverAuthResource {

    @Inject
    DriverAuthService driverAuthService;

    @POST
    @Path("/signup")
    @Transactional
    public DriverAuth createDriverAuth(DriverAuthRequest request) {

        return driverAuthService.createDriverAuth(request);
    }

    @POST
    @Path("/send-otp")
    public SendOtpResponse sendOtp(SendOtpRequest request) {

        return driverAuthService.sendOtp(request.phoneNumber);
    }

    @POST
    @Path("/verify-otp")
    public VerifyOtpResponse verifyOtp(VerifyOTPRequest request) {

        return driverAuthService.verifyOtpAndCheckDriver(
                request.phoneNumber,
                request.otp
        );
    }

    @POST
    @Path("/login")
    public LoginResponse login(LoginRequest request) {

        return driverAuthService.login(
                request.phoneNumber,
                request.password
        );
    }

    @POST
    @Path("/check-phone")
    public PhoneCheckResponse checkPhone(CheckPhoneRequest request) {

        return driverAuthService.checkPhone(request.phoneNumber);
    }
}