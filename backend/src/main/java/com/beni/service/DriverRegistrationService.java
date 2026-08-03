package com.beni.service;

import com.beni.dto.DriverApplicationCorrectionResponse;
import com.beni.dto.DriverApplicationStatusResponse;
import com.beni.dto.DriverSignupRequest;
import com.beni.dto.DriverSignupStartResponse;
import com.beni.dto.DriverSignupVerifyRequest;
import com.beni.entity.DriverApplication;
import com.beni.entity.DriverApplicationCorrection;
import com.beni.entity.DriverApplicationStatus;
import com.beni.entity.DriverAuth;
import com.beni.entity.User;
import com.beni.repository.DriverApplicationCorrectionRepository;
import com.beni.repository.DriverApplicationRepository;
import com.beni.repository.DriverAuthRepository;
import com.beni.repository.DriverRepository;
import com.beni.repository.PassengerRepository;
import com.beni.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.Year;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@ApplicationScoped
public class DriverRegistrationService {

    @Inject
    UserRepository userRepository;

    @Inject
    PassengerRepository passengerRepository;

    @Inject
    DriverRepository driverRepository;

    @Inject
    DriverAuthRepository driverAuthRepository;

    @Inject
    DriverApplicationRepository applicationRepository;

    @Inject
    DriverApplicationCorrectionRepository correctionRepository;

    @Inject
    OTPService otpService;

    @Inject
    OTPStorageService otpStorageService;

    @Inject
    EmailService emailService;

    @Inject
    PasswordService passwordService;

    @Inject
    DriverRegistrationSessionService registrationSessionService;

    @Inject
    DriverApplicantSessionService applicantSessionService;

    public DriverSignupStartResponse startSignup(
            DriverSignupRequest request
    ) {
        validateAndNormalize(request);

        User existingPassenger =
                resolveReusablePassenger(request);

        Integer existingUserId =
                existingPassenger == null
                        ? null
                        : existingPassenger.userId;

        validateApplicationIdentifiers(
                request.cnicNumber,
                request.licenseNumber,
                request.vehiclePlateNumber,
                existingUserId
        );

        String passwordHash =
                passwordService.hashPassword(request.password);

        String registrationToken =
                registrationSessionService.createSession(
                        request,
                        passwordHash,
                        existingUserId
                );

        String otp = otpService.generateOTP();

        try {
            otpStorageService.saveOTP(request.email, otp);
            emailService.sendOTPEmail(request.email, otp);
        } catch (RuntimeException exception) {
            registrationSessionService.removeSession(
                    registrationToken
            );

            otpStorageService.removeOTP(request.email);

            throw new WebApplicationException(
                    "Unable to send the verification email",
                    500
            );
        }

        DriverSignupStartResponse response =
                new DriverSignupStartResponse();

        response.success = true;
        response.message = "Verification OTP sent successfully.";
        response.maskedEmail = maskEmail(request.email);
        response.registrationToken = registrationToken;

        return response;
    }

    @Transactional
    public DriverApplicationStatusResponse verifySignup(
            DriverSignupVerifyRequest request
    ) {
        if (request == null
                || request.registrationToken == null
                || request.registrationToken.isBlank()) {
            throw new WebApplicationException(
                    "Registration token is required",
                    400
            );
        }

        if (request.otp == null
                || !request.otp.matches("^[0-9]{6}$")) {
            throw new WebApplicationException(
                    "A valid 6-digit OTP is required",
                    400
            );
        }

        DriverRegistrationSessionService.PendingDriverSignup pending =
                registrationSessionService.getSession(
                        request.registrationToken
                );

        if (pending == null) {
            throw new WebApplicationException(
                    "Registration session is invalid or expired",
                    401
            );
        }

        boolean validOtp = otpStorageService.verifyOTP(
                pending.email,
                request.otp
        );

        if (!validOtp) {
            DriverApplicationStatusResponse response =
                    new DriverApplicationStatusResponse();

            response.success = false;
            response.message = "Incorrect OTP.";

            return response;
        }

        User user = resolveUserAtVerification(pending);

        validateApplicationIdentifiers(
                pending.cnicNumber,
                pending.licenseNumber,
                pending.vehiclePlateNumber,
                user.userId
        );

        DriverAuth existingAuth = driverAuthRepository.find(
                "user",
                user
        ).firstResult();

        if (existingAuth != null) {
            throw new WebApplicationException(
                    "Driver authentication already exists for this account",
                    409
            );
        }

        DriverAuth driverAuth = new DriverAuth();
        driverAuth.user = user;
        driverAuth.passwordHash = pending.passwordHash;

        driverAuthRepository.persist(driverAuth);

        DriverApplication application =
                new DriverApplication();

        application.user = user;
        application.attemptNumber =
                applicationRepository.nextAttemptNumber(user);
        application.status =
                DriverApplicationStatus.PENDING_REVIEW;

        application.fullName = pending.fullName;
        application.phoneNumber = pending.phoneNumber;
        application.email = pending.email;
        application.cnicNumber = pending.cnicNumber;

        application.licenseNumber = pending.licenseNumber;

        application.vehicleMake = pending.vehicleMake;
        application.vehicleModel = pending.vehicleModel;
        application.vehicleYear = pending.vehicleYear;
        application.vehicleColor = pending.vehicleColor;
        application.vehiclePlateNumber =
                pending.vehiclePlateNumber;
        application.vehicleCapacity =
                pending.vehicleCapacity;

        applicationRepository.persist(application);

        otpStorageService.removeOTP(pending.email);
        registrationSessionService.removeSession(
                request.registrationToken
        );

        String applicantToken =
                applicantSessionService.createSession(user);

        return buildStatusResponse(
                application,
                applicantToken
        );
    }

    @Transactional
    public DriverApplicationStatusResponse getCurrentStatus(
            User user
    ) {
        DriverApplication application =
                applicationRepository.findLatestByUser(user);

        if (application == null) {
            throw new WebApplicationException(
                    "Driver application not found",
                    404
            );
        }

        return buildStatusResponse(application, null);
    }

    private User resolveReusablePassenger(
            DriverSignupRequest request
    ) {
        User phoneUser = userRepository.findByPhoneNumber(
                request.phoneNumber
        );

        User emailUser = userRepository.findByEmail(
                request.email
        );

        if (phoneUser == null && emailUser == null) {
            return null;
        }

        if (phoneUser != null && emailUser == null) {
            throw new WebApplicationException(
                    Response.status(Response.Status.CONFLICT)
                            .type(MediaType.APPLICATION_JSON)
                            .entity(Map.of(
                                    "success", false,
                                    "message",
                                    "This phone number belongs to an existing passenger account. Please use the email already registered with that account."
                            ))
                            .build()
            );
        }

        if (phoneUser != null
                && emailUser != null
                && !phoneUser.userId.equals(emailUser.userId)) {
            throw new WebApplicationException(
                    Response.status(Response.Status.CONFLICT)
                            .type(MediaType.APPLICATION_JSON)
                            .entity(Map.of(
                                    "success", false,
                                    "message",
                                    "This email belongs to another account. Please use the email already registered with this passenger phone number."
                            ))
                            .build()
            );
        }

        if (phoneUser == null && emailUser != null) {
            throw new WebApplicationException(
                    Response.status(Response.Status.CONFLICT)
                            .type(MediaType.APPLICATION_JSON)
                            .entity(Map.of(
                                    "success", false,
                                    "message",
                                    "This email is already registered. Please use the phone number belonging to that account or enter a different email."
                            ))
                            .build()
            );
        }

        if ("SUSPENDED".equalsIgnoreCase(
                phoneUser.accountStatus
        )) {
            throw new WebApplicationException(
                    "This account is suspended",
                    403
            );
        }

        if (passengerRepository.findByUser(phoneUser) == null) {
            throw new WebApplicationException(
                    "This account is already registered. Use driver login.",
                    409
            );
        }

        if (driverRepository.findByUser(phoneUser) != null) {
            throw new WebApplicationException(
                    "This account is already an approved driver",
                    409
            );
        }

        DriverApplication latest =
                applicationRepository.findLatestByUser(phoneUser);

        if (latest != null) {
            if (
                    latest.status
                            == DriverApplicationStatus.PENDING_REVIEW
            ) {
                throw new WebApplicationException(
                        "A driver application is already under review",
                        409
                );
            }

            if (
                    latest.status
                            == DriverApplicationStatus.APPROVED
            ) {
                throw new WebApplicationException(
                        "This driver application is already approved",
                        409
                );
            }

            throw new WebApplicationException(
                    "Use the correction form to resubmit the declined application",
                    409
            );
        }

        return phoneUser;
    }

    private User resolveUserAtVerification(
            DriverRegistrationSessionService.PendingDriverSignup pending
    ) {
        if (pending.existingUserId == null) {
            if (
                    userRepository.findByPhoneNumber(
                            pending.phoneNumber
                    ) != null
            ) {
                throw new WebApplicationException(
                        "This phone number was registered while the OTP was pending",
                        409
                );
            }

            if (
                    userRepository.findByEmail(
                            pending.email
                    ) != null
            ) {
                throw new WebApplicationException(
                        "This email was registered while the OTP was pending",
                        409
                );
            }

            User user = new User();
            user.fullName = pending.fullName;
            user.phoneNumber = pending.phoneNumber;
            user.email = pending.email;
            user.role = "driver";
            user.isAdmin = false;
            user.accountStatus = "ACTIVE";

            userRepository.persist(user);

            return user;
        }

        User user = userRepository.findById(
                pending.existingUserId.longValue()
        );

        if (user == null) {
            throw new WebApplicationException(
                    "The passenger account no longer exists",
                    404
            );
        }

        if (!pending.phoneNumber.equals(user.phoneNumber)
                || user.email == null
                || !pending.email.equalsIgnoreCase(user.email)) {
            throw new WebApplicationException(
                    "The passenger account details changed while the OTP was pending",
                    409
            );
        }

        if ("SUSPENDED".equalsIgnoreCase(user.accountStatus)) {
            throw new WebApplicationException(
                    "This account is suspended",
                    403
            );
        }

        if (passengerRepository.findByUser(user) == null) {
            throw new WebApplicationException(
                    "Passenger account not found",
                    409
            );
        }

        if (driverRepository.findByUser(user) != null) {
            throw new WebApplicationException(
                    "This account is already an approved driver",
                    409
            );
        }

        if (applicationRepository.findLatestByUser(user) != null) {
            throw new WebApplicationException(
                    "A driver application already exists for this account",
                    409
            );
        }

        return user;
    }

    private void validateApplicationIdentifiers(
            String cnicNumber,
            String licenseNumber,
            String plateNumber,
            Integer excludedUserId
    ) {
        if (
                applicationRepository
                        .activeCnicExistsForAnotherUser(
                                cnicNumber,
                                excludedUserId
                        )
        ) {
            throw new WebApplicationException(
                    "This CNIC is already used by another application",
                    409
            );
        }

        if (
                applicationRepository
                        .activeLicenseExistsForAnotherUser(
                                licenseNumber,
                                excludedUserId
                        )
        ) {
            throw new WebApplicationException(
                    "This licence number is already used",
                    409
            );
        }

        if (
                applicationRepository
                        .activePlateExistsForAnotherUser(
                                plateNumber,
                                excludedUserId
                        )
        ) {
            throw new WebApplicationException(
                    "This vehicle plate number is already used",
                    409
            );
        }
    }

    private DriverApplicationStatusResponse buildStatusResponse(
            DriverApplication application,
            String applicantToken
    ) {
        DriverApplicationStatusResponse response =
                new DriverApplicationStatusResponse();

        response.success = true;
        response.userId = application.user.userId;
        response.applicationId = application.applicationId;
        response.attemptNumber = application.attemptNumber;
        response.applicationStatus =
                application.status.name();

        response.reviewSummary = application.reviewSummary;
        response.submittedAt = application.submittedAt;
        response.reviewedAt = application.reviewedAt;
        response.applicantToken = applicantToken;

        boolean approved =
                application.status
                        == DriverApplicationStatus.APPROVED
                        && application.approvedDriver != null;

        response.canGoOnline = approved;
        response.walletEnabled = approved;
        response.canViewRideOffers = approved;

        if (approved) {
            response.driverId =
                    application.approvedDriver.driverId;

            response.message =
                    "Your driver application has been approved.";
        } else if (
                application.status
                        == DriverApplicationStatus.DECLINED
        ) {
            response.message =
                    "Your application was declined. " +
                            "Please correct the marked fields and submit again.";

            List<DriverApplicationCorrection> corrections =
                    correctionRepository.findByApplication(
                            application
                    );

            for (
                    DriverApplicationCorrection correction
                    : corrections
            ) {
                DriverApplicationCorrectionResponse item =
                        new DriverApplicationCorrectionResponse();

                item.fieldName = correction.fieldName;
                item.instruction = correction.instruction;

                response.corrections.add(item);
            }
        } else {
            response.message =
                    "Your application is under admin review.";
        }

        return response;
    }

    private void validateAndNormalize(
            DriverSignupRequest request
    ) {
        if (request == null) {
            throw new WebApplicationException(
                    "Signup information is required",
                    400
            );
        }

        request.fullName = required(
                request.fullName,
                "Full name"
        ).replaceAll("\\s+", " ");

        if (request.fullName.length() > 100) {
            throw new WebApplicationException(
                    "Full name is too long",
                    400
            );
        }

        request.phoneNumber = required(
                request.phoneNumber,
                "Phone number"
        ).replace(" ", "").replace("-", "");

        if (!request.phoneNumber.matches("^03[0-9]{9}$")) {
            throw new WebApplicationException(
                    "Phone number must use the format 03XXXXXXXXX",
                    400
            );
        }

        request.email = required(
                request.email,
                "Email"
        ).toLowerCase(Locale.ROOT);

        if (
                request.email.length() > 100
                        || !request.email.matches(
                        "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
                )
        ) {
            throw new WebApplicationException(
                    "A valid email address is required",
                    400
            );
        }

        request.cnicNumber = required(
                request.cnicNumber,
                "CNIC number"
        ).replace("-", "").replace(" ", "");

        if (!request.cnicNumber.matches("^[0-9]{13}$")) {
            throw new WebApplicationException(
                    "CNIC number must contain exactly 13 digits",
                    400
            );
        }

        request.licenseNumber = required(
                request.licenseNumber,
                "Licence number"
        ).toUpperCase(Locale.ROOT);

        if (request.licenseNumber.length() > 50) {
            throw new WebApplicationException(
                    "Licence number is too long",
                    400
            );
        }

        request.vehicleMake = required(
                request.vehicleMake,
                "Vehicle make"
        );

        request.vehicleModel = required(
                request.vehicleModel,
                "Vehicle model"
        );

        request.vehicleColor = required(
                request.vehicleColor,
                "Vehicle color"
        );

        request.vehiclePlateNumber = required(
                request.vehiclePlateNumber,
                "Vehicle plate number"
        ).toUpperCase(Locale.ROOT);

        if (request.vehicleMake.length() > 50
                || request.vehicleModel.length() > 50
                || request.vehicleColor.length() > 30
                || request.vehiclePlateNumber.length() > 20) {
            throw new WebApplicationException(
                    "One or more vehicle fields are too long",
                    400
            );
        }

        int maximumYear = Year.now().getValue() + 1;

        if (
                request.vehicleYear == null
                        || request.vehicleYear < 2000
                        || request.vehicleYear > maximumYear
        ) {
            throw new WebApplicationException(
                    "Vehicle year is invalid",
                    400
            );
        }

        if (
                request.vehicleCapacity == null
                        || request.vehicleCapacity <= 0
        ) {
            throw new WebApplicationException(
                    "Vehicle capacity must be greater than zero",
                    400
            );
        }

        request.password = required(
                request.password,
                "Password"
        );

        if (request.password.length() < 6) {
            throw new WebApplicationException(
                    "Password must contain at least 6 characters",
                    400
            );
        }
    }

    private String required(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new WebApplicationException(
                    fieldName + " is required",
                    400
            );
        }

        return value.trim();
    }

    private String maskEmail(String email) {
        int atIndex = email.indexOf('@');

        if (atIndex <= 0) {
            return email;
        }

        String username = email.substring(0, atIndex);
        String domain = email.substring(atIndex);

        if (username.length() <= 2) {
            return username.charAt(0) + "••" + domain;
        }

        return username.substring(0, 2)
                + "•".repeat(username.length() - 2)
                + domain;
    }
}