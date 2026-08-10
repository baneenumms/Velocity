package com.beni.service;

import com.beni.dto.PhoneCheckResponse;
import com.beni.dto.VerifyOtpResponse;
import com.beni.entity.Passenger;
import com.beni.entity.User;
import com.beni.repository.PassengerRepository;
import com.beni.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class PassengerAuthService {

    @Inject
    PassengerRepository passengerRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    OTPService otpService;

    @Inject
    OTPStorageService otpStorageService;

    @Inject
    EmailService emailService;

    public PhoneCheckResponse checkPhone(
            String phoneNumber
    ) {
        PhoneCheckResponse response =
                new PhoneCheckResponse();

        if (
                phoneNumber == null ||
                        phoneNumber.isBlank()
        ) {
            response.exists = false;
            response.success = false;
            response.message =
                    "Phone number is required.";

            return response;
        }

        User user =
                userRepository.findByPhoneNumber(
                        phoneNumber
                );

        if (user == null) {
            response.exists = false;
            response.success = false;
            response.message =
                    "Passenger not found.";

            return response;
        }

        Passenger passenger =
                passengerRepository.findByUser(
                        user
                );

        if (passenger == null) {
            response.exists = false;
            response.success = false;
            response.message =
                    "This phone number is not registered as a passenger.";

            return response;
        }

        /*
         * Keep exists=true so a suspended passenger
         * is not incorrectly sent to signup.
         */
        if (isSuspended(user)) {
            response.exists = true;
            response.success = false;
            response.message =
                    "This passenger account is suspended.";

            return response;
        }

        if (
                user.email == null ||
                        user.email.isBlank()
        ) {
            response.exists = true;
            response.success = false;
            response.message =
                    "No email is registered for this passenger.";

            return response;
        }

        String otp =
                otpService.generateOTP();

        otpStorageService.saveOTP(
                user,
                user.email,
                "PASSENGER_LOGIN",
                otp
        );

        emailService.sendOTPEmail(
                user.email,
                otp
        );

        response.exists = true;
        response.success = true;
        response.message =
                "OTP sent successfully.";

        response.maskedEmail =
                maskEmail(user.email);

        return response;
    }

    public VerifyOtpResponse verifyOtp(
            String phoneNumber,
            String otp
    ) {
        VerifyOtpResponse response =
                new VerifyOtpResponse();

        if (
                phoneNumber == null ||
                        phoneNumber.isBlank()
        ) {
            response.success = false;
            response.message =
                    "Phone number is required.";

            return response;
        }

        if (
                otp == null ||
                        otp.isBlank()
        ) {
            response.success = false;
            response.message =
                    "OTP is required.";

            return response;
        }

        User user =
                userRepository.findByPhoneNumber(
                        phoneNumber
                );

        if (user == null) {
            response.success = false;
            response.message =
                    "Passenger not found.";

            return response;
        }

        Passenger passenger =
                passengerRepository.findByUser(
                        user
                );

        if (passenger == null) {
            response.success = false;
            response.message =
                    "Passenger record not found.";

            return response;
        }

        if (isSuspended(user)) {
            response.success = false;
            response.message =
                    "This passenger account is suspended.";

            return response;
        }

        if (
                user.email == null ||
                        user.email.isBlank()
        ) {
            response.success = false;
            response.message =
                    "No email is registered for this passenger.";

            return response;
        }

        boolean valid =
                otpStorageService.consumeOTP(
                        user.email,
                        "PASSENGER_LOGIN",
                        otp
                );

        if (!valid) {
            response.success = false;
            response.message =
                    "Invalid OTP.";

            return response;
        }

        response.success = true;
        response.message =
                "Login successful.";

        response.nextStep =
                "DASHBOARD";

        response.userId =
                user.userId;

        response.passengerId =
                passenger.passengerId;

        response.fullName =
                user.fullName;

        response.phoneNumber =
                user.phoneNumber;

        response.email =
                user.email;

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
        int atIndex =
                email.indexOf("@");

        if (atIndex <= 1) {
            return "***" +
                    email.substring(
                            atIndex
                    );
        }

        String firstCharacter =
                email.substring(
                        0,
                        1
                );

        String domain =
                email.substring(
                        atIndex
                );

        return firstCharacter +
                "***" +
                domain;
    }
}
