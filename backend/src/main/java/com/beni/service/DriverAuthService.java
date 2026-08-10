package com.beni.service;

import com.beni.dto.DriverAuthRequest;
import com.beni.dto.LoginResponse;
import com.beni.dto.PhoneCheckResponse;
import com.beni.dto.SendOtpResponse;
import com.beni.dto.VerifyOtpResponse;
import com.beni.entity.Driver;
import com.beni.entity.DriverApplication;
import com.beni.entity.DriverApplicationStatus;
import com.beni.entity.DriverAuth;
import com.beni.entity.User;
import com.beni.repository.DriverApplicationRepository;
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
    DriverApplicationRepository applicationRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    OTPService otpService;

    @Inject
    OTPStorageService otpStorageService;

    @Inject
    EmailService emailService;

    @Inject
    PasswordService passwordService;

    @Inject
    AdminSessionService adminSessionService;

    @Inject
    DriverApplicantSessionService applicantSessionService;

    @Transactional
    public DriverAuth createDriverAuth(
            DriverAuthRequest request
    ) {
        if (request == null || request.userId == null) {
            throw new WebApplicationException(
                    "User ID is required",
                    400
            );
        }

        User user = userRepository.findById(
                request.userId.longValue()
        );

        if (user == null) {
            throw new WebApplicationException(
                    "User not found",
                    404
            );
        }

        if (!"driver".equalsIgnoreCase(user.role)) {
            throw new WebApplicationException(
                    "User is not a driver",
                    400
            );
        }

        DriverAuth existing = driverAuthRepository.find(
                "user",
                user
        ).firstResult();

        if (existing != null) {
            throw new WebApplicationException(
                    "Driver authentication already exists",
                    409
            );
        }

        if (request.passwordHash == null
                || request.passwordHash.isBlank()) {
            throw new WebApplicationException(
                    "Password is required",
                    400
            );
        }

        DriverAuth driverAuth = new DriverAuth();
        driverAuth.user = user;

        if (passwordService.isHashed(request.passwordHash)) {
            driverAuth.passwordHash = request.passwordHash;
        } else {
            driverAuth.passwordHash =
                    passwordService.hashPassword(
                            request.passwordHash
                    );
        }

        driverAuthRepository.persist(driverAuth);

        return driverAuth;
    }

    public SendOtpResponse sendOtp(String phoneNumber) {
        User user = userRepository.findByPhoneNumber(
                phoneNumber
        );

        if (user == null) {
            throw new WebApplicationException(
                    "User not found",
                    404
            );
        }

        requireActiveAccount(user);

        if (user.email == null || user.email.isBlank()) {
            throw new WebApplicationException(
                    "No email registered for this user",
                    400
            );
        }

        String otp = otpService.generateOTP();

        otpStorageService.saveOTP(
                user,
                user.email,
                "DRIVER_LOGIN",
                otp
        );
        emailService.sendOTPEmail(user.email, otp);

        SendOtpResponse response = new SendOtpResponse();
        response.success = true;
        response.maskedEmail = maskEmail(user.email);
        response.message = "OTP sent successfully.";

        return response;
    }

    public boolean verifyOtp(
            String email,
            String enteredOtp
    ) {
        return otpStorageService.consumeOTP(
                email,
                "DRIVER_LOGIN",
                enteredOtp
        );
    }

    public boolean isDriverRegistered(String phoneNumber) {
        User user = userRepository.findByPhoneNumber(
                phoneNumber
        );

        if (user == null) {
            return false;
        }

        return driverRepository.findByUser(user) != null;
    }

    public VerifyOtpResponse verifyOtpAndCheckDriver(
            String phoneNumber,
            String enteredOtp
    ) {
        VerifyOtpResponse response = new VerifyOtpResponse();

        User user = userRepository.findByPhoneNumber(
                phoneNumber
        );

        if (user == null) {
            response.success = false;
            response.message = "User not found";
            return response;
        }

        requireActiveAccount(user);

        if (!verifyOtp(user.email, enteredOtp)) {
            response.success = false;
            response.message = "Invalid OTP";
            return response;
        }

        Driver driver = driverRepository.findByUser(user);

        DriverApplication application =
                applicationRepository.findLatestByUser(user);

        response.success = true;

        if (driver != null || application != null) {
            response.nextStep = "PASSWORD";
        } else {
            response.nextStep = "SIGNUP";
        }

        return response;
    }

    public PhoneCheckResponse checkPhone(
            String phoneNumber
    ) {
        PhoneCheckResponse response =
                new PhoneCheckResponse();

        User user = userRepository.findByPhoneNumber(
                phoneNumber
        );

        if (user == null) {
            response.exists = false;
            return response;
        }

        if ("SUSPENDED".equalsIgnoreCase(
                user.accountStatus
        )) {
            response.exists = true;
            return response;
        }

        Driver driver = driverRepository.findByUser(user);

        DriverApplication application =
                applicationRepository.findLatestByUser(user);

        response.exists =
                driver != null || application != null;

        return response;
    }

    @Transactional
    public LoginResponse login(
            String phoneNumber,
            String password
    ) {
        LoginResponse response = new LoginResponse();

        User user = userRepository.findByPhoneNumber(
                phoneNumber
        );

        if (user == null) {
            response.success = false;
            response.message = "User not found";
            return response;
        }

        requireActiveAccount(user);

        DriverAuth driverAuth = driverAuthRepository.find(
                "user",
                user
        ).firstResult();

        if (driverAuth == null) {
            response.success = false;
            response.message = "Driver account not found";
            return response;
        }

        if (!passwordService.matches(
                password,
                driverAuth.passwordHash
        )) {
            response.success = false;
            response.message = "Incorrect password";
            return response;
        }

        if (!passwordService.isHashed(
                driverAuth.passwordHash
        )) {
            driverAuth.passwordHash =
                    passwordService.hashPassword(password);
        }

        response.success = true;
        response.userId = user.userId;
        response.fullName = user.fullName;

        Driver driver = driverRepository.findByUser(user);

        if (driver != null) {
            response.message = "Login successful";
            response.driverId = driver.driverId;
            response.nextStep = "DASHBOARD";

            response.canGoOnline = true;
            response.walletEnabled = true;
            response.canViewRideOffers = true;

            response.isAdmin =
                    Boolean.TRUE.equals(user.isAdmin);

            if (response.isAdmin) {
                response.adminToken =
                        adminSessionService.createSession(user);
            }

            return response;
        }

        DriverApplication application =
                applicationRepository.findLatestByUser(user);

        if (application == null) {
            response.success = false;
            response.message =
                    "Driver account or application not found";
            return response;
        }

        response.nextStep = "APPLICATION_STATUS";
        response.applicationStatus =
                application.status.name();

        response.canGoOnline = false;
        response.walletEnabled = false;
        response.canViewRideOffers = false;
        response.isAdmin = false;

        response.applicantToken =
                applicantSessionService.createSession(user);

        if (
                application.status
                        == DriverApplicationStatus.PENDING_REVIEW
        ) {
            response.message =
                    "Your application is under admin review.";
        } else if (
                application.status
                        == DriverApplicationStatus.DECLINED
        ) {
            response.message =
                    "Your application was declined. " +
                            "Please review the required corrections.";
        } else {
            response.message =
                    "Your approved account is being activated.";
        }

        return response;
    }

    private void requireActiveAccount(User user) {
        if ("SUSPENDED".equalsIgnoreCase(
                user.accountStatus
        )) {
            throw new WebApplicationException(
                    "This account is suspended",
                    403
            );
        }
    }

    private String maskEmail(String email) {
        String[] parts = email.split("@", 2);

        if (parts.length != 2) {
            return email;
        }

        String username = parts[0];
        String domain = parts[1];

        if (username.length() <= 3) {
            return username + "@" + domain;
        }

        return username.substring(0, 3)
                + "•".repeat(username.length() - 3)
                + "@"
                + domain;
    }
}
