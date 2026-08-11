package com.beni.service;

import com.beni.dto.*;
import com.beni.entity.*;
import com.beni.repository.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@ApplicationScoped
public class AdminDriverApplicationService {

    @Inject
    UserRoleService userRoleService;

    private static final Set<String> CORRECTABLE_FIELDS =
            Set.of(
                    "full_name",
                    "phone_number",
                    "email",
                    "cnic_number",
                    "license_number",
                    "vehicle_make",
                    "vehicle_model",
                    "vehicle_year",
                    "vehicle_color",
                    "vehicle_plate_number",
                    "vehicle_capacity"
            );

    @Inject
    DriverApplicationRepository applicationRepository;

    @Inject
    DriverApplicationCorrectionRepository correctionRepository;

    @Inject
    PassengerRepository passengerRepository;

    @Inject
    DriverRepository driverRepository;

    @Inject
    VehicleRepository vehicleRepository;

    @Inject
    WalletRepository walletRepository;

    @Inject
    AdminAccountService adminAccountService;

    @Transactional
    public List<AdminDriverApplicationResponse> listApplications(
            String statusText,
            User admin
    ) {
        requireAdmin(admin);

        List<DriverApplication> applications;

        if (statusText == null
                || statusText.isBlank()
                || statusText.equalsIgnoreCase("ALL")) {
            applications =
                    applicationRepository.findAllNewestFirst();
        } else {
            DriverApplicationStatus status =
                    parseStatus(statusText);

            applications =
                    applicationRepository.findByStatus(status);
        }

        List<AdminDriverApplicationResponse> responses =
                new ArrayList<>();

        for (DriverApplication application : applications) {
            responses.add(toResponse(application, admin));
        }

        return responses;
    }

    @Transactional
    public AdminDriverApplicationResponse getApplication(
            Integer applicationId,
            User admin
    ) {
        requireAdmin(admin);

        DriverApplication application =
                findApplication(applicationId);

        return toResponse(application, admin);
    }

    @Transactional
    public AdminDriverApplicationDecisionResponse approve(
            Integer applicationId,
            AdminApproveDriverApplicationRequest request,
            User admin
    ) {
        requireAdmin(admin);

        DriverApplication application =
                applicationRepository.findByIdForUpdate(
                        applicationId
                );

        require(
                application != null,
                "Driver application was not found.",
                404
        );

        requireReviewable(application, admin);

        require(
                application.status
                        == DriverApplicationStatus.PENDING_REVIEW,
                "Only a pending application can be approved.",
                409
        );

        User applicant = application.user;

        require(
                "ACTIVE".equalsIgnoreCase(
                        applicant.accountStatus
                ),
                "A suspended account cannot be approved.",
                409
        );

        require(
                driverRepository.findByUser(applicant) == null,
                "A driver record already exists for this user.",
                409
        );

        Driver licenceOwner =
                driverRepository
                        .findByLicenseNumberIgnoreCase(
                                application.licenseNumber
                        );

        require(
                licenceOwner == null,
                "This licence number already belongs to another driver.",
                409
        );

        Vehicle plateOwner =
                vehicleRepository
                        .findByPlateNumberIgnoreCase(
                                application.vehiclePlateNumber
                        );

        require(
                plateOwner == null,
                "This plate number already belongs to another vehicle.",
                409
        );

        String reviewSummary = cleanOptional(
                request == null
                        ? null
                        : request.reviewSummary,
                1000,
                "Approval note"
        );

        /*
         * Contact details were email-OTP verified during signup.
         * For a dual passenger/driver user, the same users row is
         * intentionally reused.
         */
        applicant.fullName = application.fullName;
        applicant.phoneNumber = application.phoneNumber;
        applicant.email = application.email;

        Driver driver = new Driver();
        driver.user = applicant;
        driver.licenseNumber =
                application.licenseNumber;
        driver.driverStatus =
                DriverStatus.Offline;

        driverRepository.persist(driver);
        driverRepository.flush();
        userRoleService.grantRole(applicant, "DRIVER");

        Vehicle vehicle = new Vehicle();
        vehicle.driver = driver;
        vehicle.make = application.vehicleMake;
        vehicle.model = application.vehicleModel;
        vehicle.vehicleYear =
                application.vehicleYear;
        vehicle.color = application.vehicleColor;
        vehicle.plateNumber =
                application.vehiclePlateNumber;
        vehicle.vehicleType = "Car";
        vehicle.capacity =
                application.vehicleCapacity;

        vehicleRepository.persist(vehicle);
        vehicleRepository.flush();

        Wallet wallet = new Wallet();
        wallet.driver = driver;
        wallet.balance = BigDecimal.ZERO;
        wallet.reservedBalance = BigDecimal.ZERO;

        walletRepository.persist(wallet);
        walletRepository.flush();

        application.status =
                DriverApplicationStatus.APPROVED;

        application.reviewedAt =
                LocalDateTime.now();

        application.reviewedBy = admin;
        application.reviewSummary = reviewSummary;
        application.approvedDriver = driver;

        AdminDriverApplicationDecisionResponse response =
                new AdminDriverApplicationDecisionResponse();

        response.success = true;
        response.message =
                "Driver application approved successfully.";

        response.applicationId =
                application.applicationId;

        response.applicationStatus =
                application.status.name();

        response.userId = applicant.userId;
        response.accountStatus =
                applicant.accountStatus;

        response.driverId = driver.driverId;
        response.vehicleId = vehicle.vehicleId;
        response.walletId = wallet.walletId;
        response.accountSuspended = false;

        return response;
    }

    @Transactional
    public AdminDriverApplicationDecisionResponse decline(
            Integer applicationId,
            AdminDeclineDriverApplicationRequest request,
            User admin
    ) {
        requireAdmin(admin);

        DriverApplication application =
                applicationRepository.findByIdForUpdate(
                        applicationId
                );

        require(
                application != null,
                "Driver application was not found.",
                404
        );

        requireReviewable(application, admin);

        require(
                application.status
                        == DriverApplicationStatus.PENDING_REVIEW,
                "Only a pending application can be declined.",
                409
        );

        require(
                request != null,
                "Decline information is required.",
                400
        );

        require(
                request.corrections != null
                        && !request.corrections.isEmpty(),
                "At least one incorrect field must be identified.",
                400
        );

        String reviewSummary = cleanOptional(
                request.reviewSummary,
                1000,
                "Review summary"
        );

        boolean suspendAccount =
                Boolean.TRUE.equals(
                        request.suspendAccount
                );

        String suspensionReason = null;

        if (suspendAccount) {
            suspensionReason = requiredText(
                    request.suspensionReason,
                    500,
                    "Suspension reason"
            );
        }

        Set<String> submittedFields =
                new HashSet<>();

        List<DriverApplicationCorrection> corrections =
                new ArrayList<>();

        for (
                AdminApplicationCorrectionRequest correctionRequest
                : request.corrections
        ) {
            require(
                    correctionRequest != null,
                    "Correction information cannot be empty.",
                    400
            );

            String fieldName = requiredText(
                    correctionRequest.fieldName,
                    50,
                    "Correction field"
            ).toLowerCase(Locale.ROOT);

            require(
                    CORRECTABLE_FIELDS.contains(fieldName),
                    "Unsupported correction field: " + fieldName,
                    400
            );

            require(
                    submittedFields.add(fieldName),
                    "A correction field cannot be repeated: "
                            + fieldName,
                    400
            );

            String instruction = requiredText(
                    correctionRequest.instruction,
                    1000,
                    "Correction instruction"
            );

            DriverApplicationCorrection correction =
                    new DriverApplicationCorrection();

            correction.application = application;
            correction.fieldName = fieldName;
            correction.instruction = instruction;
            correction.createdBy = admin;

            corrections.add(correction);
        }

        application.status =
                DriverApplicationStatus.DECLINED;

        application.reviewedAt =
                LocalDateTime.now();

        application.reviewedBy = admin;
        application.reviewSummary = reviewSummary;

        correctionRepository.persist(corrections);

        if (suspendAccount) {
            AccountSuspensionRequest suspensionRequest =
                    new AccountSuspensionRequest();

            suspensionRequest.reason =
                    suspensionReason;

            adminAccountService.suspend(
                    application.user.userId,
                    suspensionRequest,
                    admin
            );
        }

        AdminDriverApplicationDecisionResponse response =
                new AdminDriverApplicationDecisionResponse();

        response.success = true;

        response.message = suspendAccount
                ? "Application declined and account suspended."
                : "Application declined with correction instructions.";

        response.applicationId =
                application.applicationId;

        response.applicationStatus =
                application.status.name();

        response.userId =
                application.user.userId;

        response.accountStatus =
                application.user.accountStatus;

        response.accountSuspended =
                suspendAccount;

        return response;
    }

    private DriverApplication findApplication(
            Integer applicationId
    ) {
        require(
                applicationId != null
                        && applicationId > 0,
                "Valid application ID is required.",
                400
        );

        DriverApplication application =
                applicationRepository.find(
                        "applicationId = ?1",
                        applicationId
                ).firstResult();

        require(
                application != null,
                "Driver application was not found.",
                404
        );

        return application;
    }

    private AdminDriverApplicationResponse toResponse(
            DriverApplication application,
            User admin
    ) {
        AdminDriverApplicationResponse response =
                new AdminDriverApplicationResponse();

        response.applicationId =
                application.applicationId;

        response.attemptNumber =
                application.attemptNumber;

        response.status =
                application.status.name();

        response.userId =
                application.user.userId;

        response.accountStatus =
                application.user.accountStatus;

        response.existingPassenger =
                passengerRepository.findByUser(
                        application.user
                ) != null;

        response.fullName =
                application.fullName;

        response.phoneNumber =
                application.phoneNumber;

        response.email =
                application.email;

        response.cnicNumber =
                application.cnicNumber;

        response.licenseNumber =
                application.licenseNumber;

        response.vehicleMake =
                application.vehicleMake;

        response.vehicleModel =
                application.vehicleModel;

        response.vehicleYear =
                application.vehicleYear;

        response.vehicleColor =
                application.vehicleColor;

        response.vehiclePlateNumber =
                application.vehiclePlateNumber;

        response.vehicleCapacity =
                application.vehicleCapacity;

        response.submittedAt =
                application.submittedAt;

        response.reviewedAt =
                application.reviewedAt;

        response.reviewSummary =
                application.reviewSummary;

        if (application.reviewedBy != null) {
            response.reviewedByUserId =
                    application.reviewedBy.userId;

            response.reviewedByName =
                    application.reviewedBy.fullName;
        }

        if (application.approvedDriver != null) {
            response.approvedDriverId =
                    application.approvedDriver.driverId;
        }

        boolean reviewable =
                application.status
                        == DriverApplicationStatus.PENDING_REVIEW
                        && !application.user.userId.equals(
                        admin.userId
                )
                        && !Boolean.TRUE.equals(
                        application.user.isAdmin
                );

        response.canApprove = reviewable;
        response.canDecline = reviewable;

        response.canSuspend =
                reviewable
                        && !"SUSPENDED".equalsIgnoreCase(
                        application.user.accountStatus
                );

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

        return response;
    }

    private void requireReviewable(
            DriverApplication application,
            User admin
    ) {
        require(
                !application.user.userId.equals(
                        admin.userId
                ),
                "You cannot review your own driver application.",
                403
        );

        require(
                !Boolean.TRUE.equals(
                        application.user.isAdmin
                ),
                "Another admin account cannot be reviewed here.",
                403
        );
    }

    private DriverApplicationStatus parseStatus(
            String statusText
    ) {
        try {
            return DriverApplicationStatus.valueOf(
                    statusText
                            .trim()
                            .toUpperCase(Locale.ROOT)
            );
        } catch (IllegalArgumentException exception) {
            throw new WebApplicationException(
                    "Application status must be "
                            + "PENDING_REVIEW, APPROVED or DECLINED.",
                    400
            );
        }
    }

    private String requiredText(
            String value,
            int maximumLength,
            String fieldName
    ) {
        require(
                value != null && !value.isBlank(),
                fieldName + " is required.",
                400
        );

        String cleaned = value.trim();

        require(
                cleaned.length() <= maximumLength,
                fieldName + " cannot exceed "
                        + maximumLength
                        + " characters.",
                400
        );

        return cleaned;
    }

    private String cleanOptional(
            String value,
            int maximumLength,
            String fieldName
    ) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String cleaned = value.trim();

        require(
                cleaned.length() <= maximumLength,
                fieldName + " cannot exceed "
                        + maximumLength
                        + " characters.",
                400
        );

        return cleaned;
    }

    private void requireAdmin(User admin) {
        require(
                admin != null
                        && admin.userId != null
                        && Boolean.TRUE.equals(
                        admin.isAdmin
                ),
                "Admin access is required.",
                403
        );
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
