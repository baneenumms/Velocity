package com.beni.service;

import com.beni.dto.PassengerSignupRequest;
import com.beni.dto.PassengerSignupVerifyRequest;
import com.beni.dto.SendOtpResponse;
import com.beni.dto.VerifyOtpResponse;
import com.beni.entity.Passenger;
import com.beni.entity.User;
import com.beni.repository.PassengerRepository;
import com.beni.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

import java.util.Locale;

@ApplicationScoped
public class PassengerRegistrationService {

    @Inject
    UserRepository userRepository;

    @Inject
    PassengerRepository passengerRepository;

    @Inject
    OTPService otpService;

    @Inject
    OTPStorageService otpStorageService;

    @Inject
    EmailService emailService;

    public SendOtpResponse sendSignupOtp(
            PassengerSignupRequest request
    ) {
        require(
                request != null,
                "Request body is required",
                400
        );

        String fullName =
                normalizeName(request.fullName);

        String phoneNumber =
                normalizePhone(request.phoneNumber);

        String email =
                normalizeEmail(request.email);

        requireAvailable(
                phoneNumber,
                email
        );

        String otp =
                otpService.generateOTP();

        otpStorageService.saveOTP(
                email,
                otp
        );

        emailService.sendOTPEmail(
                email,
                otp
        );

        SendOtpResponse response =
                new SendOtpResponse();

        response.success = true;
        response.message =
                "OTP sent successfully.";

        response.maskedEmail =
                maskEmail(email);

        return response;
    }

    @Transactional
    public VerifyOtpResponse verifySignupOtp(
            PassengerSignupVerifyRequest request
    ) {
        require(
                request != null,
                "Request body is required",
                400
        );

        String fullName =
                normalizeName(request.fullName);

        String phoneNumber =
                normalizePhone(request.phoneNumber);

        String email =
                normalizeEmail(request.email);

        String otp =
                request.otp == null
                        ? ""
                        : request.otp.trim();

        require(
                otp.matches("\\d{6}"),
                "A valid 6-digit OTP is required",
                400
        );

        /*
         * Check again because another account
         * may have been created after OTP sending.
         */
        requireAvailable(
                phoneNumber,
                email
        );

        boolean valid =
                otpStorageService.verifyOTP(
                        email,
                        otp
                );

        if (!valid) {
            VerifyOtpResponse response =
                    new VerifyOtpResponse();

            response.success = false;
            response.message =
                    "Incorrect OTP.";

            return response;
        }

        User user = new User();

        user.fullName = fullName;
        user.phoneNumber = phoneNumber;
        user.email = email;
        user.role = "passenger";

        userRepository.persist(user);
        userRepository.flush();

        Passenger passenger =
                new Passenger();

        passenger.user = user;

        passengerRepository.persist(
                passenger
        );

        passengerRepository.flush();

        /*
         * Remove the OTP only after both records
         * have been created successfully.
         */
        otpStorageService.removeOTP(email);

        VerifyOtpResponse response =
                new VerifyOtpResponse();

        response.success = true;
        response.message =
                "Passenger account created successfully.";

        response.nextStep = "DASHBOARD";
        response.userId = user.userId;
        response.passengerId =
                passenger.passengerId;

        response.fullName = user.fullName;
        response.phoneNumber =
                user.phoneNumber;

        response.email = user.email;

        return response;
    }

    private void requireAvailable(
            String phoneNumber,
            String email
    ) {
        require(
                userRepository.findByPhoneNumber(
                        phoneNumber
                ) == null,
                "This phone number is already registered.",
                409
        );

        require(
                userRepository.findByEmail(
                        email
                ) == null,
                "This email address is already registered.",
                409
        );
    }

    private String normalizeName(
            String value
    ) {
        require(
                value != null &&
                        !value.trim().isEmpty(),
                "Full name is required.",
                400
        );

        String name = value.trim();

        require(
                name.length() <= 100,
                "Full name cannot exceed 100 characters.",
                400
        );

        return name;
    }

    private String normalizePhone(
            String value
    ) {
        require(
                value != null &&
                        !value.trim().isEmpty(),
                "Phone number is required.",
                400
        );

        String digits =
                value.replaceAll("\\D", "");

        if (digits.length() == 10) {
            digits = "0" + digits;
        }

        require(
                digits.matches("03\\d{9}"),
                "Please enter a valid Pakistani mobile number.",
                400
        );

        return digits;
    }

    private String normalizeEmail(
            String value
    ) {
        require(
                value != null &&
                        !value.trim().isEmpty(),
                "Email address is required.",
                400
        );

        String email =
                value.trim()
                        .toLowerCase(
                                Locale.ROOT
                        );

        require(
                email.length() <= 100,
                "Email address cannot exceed 100 characters.",
                400
        );

        require(
                email.matches(
                        "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
                ),
                "Please enter a valid email address.",
                400
        );

        return email;
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

        return email.substring(0, 1) +
                "***" +
                email.substring(atIndex);
    }

    private void require(
            boolean condition,
            String message,
            int status
    ) {
        if (!condition) {
            throw new WebApplicationException(
                    message,
                    status
            );
        }
    }
}