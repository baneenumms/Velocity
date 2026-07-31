package com.beni.service;

import com.beni.dto.DriverAuthRequest;
import com.beni.dto.LoginResponse;
import com.beni.dto.PhoneCheckResponse;
import com.beni.dto.SendOtpResponse;
import com.beni.dto.VerifyOtpResponse;
import com.beni.entity.Driver;
import com.beni.entity.DriverAuth;
import com.beni.entity.User;
import com.beni.repository.DriverAuthRepository;
import com.beni.repository.DriverRepository;
import com.beni.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

@ApplicationScoped
public class DriverAuthService {

    @Inject
    DriverRepository driverRepository;

    @Inject
    DriverAuthRepository driverAuthRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    OTPService otpService;

    @Inject
    OTPStorageService otpStorageService;

    @Inject
    EmailService emailService;

    @Inject
    AdminSessionService adminSessionService;

    @Transactional
    public DriverAuth createDriverAuth(
            DriverAuthRequest request
    ) {
        User user =
                userRepository.findById(
                        request.userId.longValue()
                );

        if (user == null) {
            throw new WebApplicationException(
                    "User not found",
                    404
            );
        }

        if (
                user.role == null ||
                        !user.role.equalsIgnoreCase(
                                "driver"
                        )
        ) {
            throw new WebApplicationException(
                    "User is not a driver",
                    400
            );
        }

        DriverAuth driverAuth =
                new DriverAuth();

        driverAuth.user = user;
        driverAuth.passwordHash =
                request.passwordHash;

        driverAuthRepository.persist(
                driverAuth
        );

        return driverAuth;
    }

    public SendOtpResponse sendOtp(
            String phoneNumber
    ) {
        User user =
                userRepository.findByPhoneNumber(
                        phoneNumber
                );

        if (user == null) {
            throw new WebApplicationException(
                    "User not found",
                    404
            );
        }

        if (isSuspended(user)) {
            throw new WebApplicationException(
                    "This account is suspended.",
                    403
            );
        }

        if (
                user.email == null ||
                        user.email.isBlank()
        ) {
            throw new WebApplicationException(
                    "No email registered for this user",
                    400
            );
        }

        String otp =
                otpService.generateOTP();

        otpStorageService.saveOTP(
                user.email,
                otp
        );

        emailService.sendOTPEmail(
                user.email,
                otp
        );

        SendOtpResponse response =
                new SendOtpResponse();

        response.success = true;
        response.maskedEmail =
                maskEmail(user.email);

        response.message =
                "OTP sent successfully.";

        return response;
    }

    public boolean verifyOtp(
            String email,
            String enteredOtp
    ) {
        boolean valid =
                otpStorageService.verifyOTP(
                        email,
                        enteredOtp
                );

        if (valid) {
            otpStorageService.removeOTP(
                    email
            );
        }

        return valid;
    }

    public boolean isDriverRegistered(
            String phoneNumber
    ) {
        User user =
                userRepository.findByPhoneNumber(
                        phoneNumber
                );

        if (user == null) {
            return false;
        }

        Driver driver =
                driverRepository.findByUser(
                        user
                );

        return driver != null;
    }

    public VerifyOtpResponse
    verifyOtpAndCheckDriver(
            String phoneNumber,
            String enteredOtp
    ) {
        VerifyOtpResponse response =
                new VerifyOtpResponse();

        User user =
                userRepository.findByPhoneNumber(
                        phoneNumber
                );

        if (user == null) {
            response.success = false;
            response.message =
                    "User not found";

            return response;
        }

        if (isSuspended(user)) {
            response.success = false;
            response.message =
                    "This account is suspended.";

            return response;
        }

        if (
                !verifyOtp(
                        user.email,
                        enteredOtp
                )
        ) {
            response.success = false;
            response.message =
                    "Invalid OTP";

            return response;
        }

        if (
                isDriverRegistered(
                        phoneNumber
                )
        ) {
            response.success = true;
            response.nextStep =
                    "PASSWORD";
        } else {
            response.success = true;
            response.nextStep =
                    "SIGNUP";
        }

        return response;
    }

    public PhoneCheckResponse checkPhone(
            String phoneNumber
    ) {
        PhoneCheckResponse response =
                new PhoneCheckResponse();

        User user =
                userRepository.findByPhoneNumber(
                        phoneNumber
                );

        response.exists =
                user != null;

        return response;
    }

    public LoginResponse login(
            String phoneNumber,
            String password
    ) {
        LoginResponse response =
                new LoginResponse();

        User user =
                userRepository.findByPhoneNumber(
                        phoneNumber
                );

        if (user == null) {
            response.success = false;
            response.message =
                    "User not found";

            return response;
        }

        if (isSuspended(user)) {
            response.success = false;
            response.message =
                    "This account is suspended.";

            return response;
        }

        DriverAuth driverAuth =
                driverAuthRepository
                        .find(
                                "user",
                                user
                        )
                        .firstResult();

        if (driverAuth == null) {
            response.success = false;
            response.message =
                    "Driver account not found";

            return response;
        }

        if (
                !driverAuth.passwordHash
                        .equals(password)
        ) {
            response.success = false;
            response.message =
                    "Incorrect password";

            return response;
        }

        Driver driver =
                driverRepository.findByUser(
                        user
                );

        if (driver == null) {
            response.success = false;
            response.message =
                    "Driver record not found";

            return response;
        }

        response.success = true;
        response.message =
                "Login Successful";

        response.driverId =
                driver.driverId;

        response.userId =
                user.userId;

        response.fullName =
                user.fullName;

        response.isAdmin =
                Boolean.TRUE.equals(
                        user.isAdmin
                );

        if (response.isAdmin) {
            response.adminToken =
                    adminSessionService
                            .createSession(
                                    user
                            );
        }

        return response;
    }

    private boolean isSuspended(
            User user
    ) {
        return user != null &&
                "SUSPENDED"
                        .equalsIgnoreCase(
                                user.accountStatus
                        );
    }

    private String maskEmail(
            String email
    ) {
        String[] parts =
                email.split("@");

        String username =
                parts[0];

        String domain =
                parts[1];

        if (username.length() <= 3) {
            return username +
                    "@" +
                    domain;
        }

        StringBuilder masked =
                new StringBuilder();

        masked.append(
                username.substring(
                        0,
                        3
                )
        );

        for (
                int index = 3;
                index < username.length();
                index++
        ) {
            masked.append("•");
        }

        return masked +
                "@" +
                domain;
    }
}