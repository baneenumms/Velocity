package com.beni.service;
import com.beni.dto.DriverApplicationCorrectionFormResponse;
import com.beni.dto.DriverApplicationCorrectionResponse;
import com.beni.dto.DriverApplicationResubmitRequest;
import com.beni.dto.DriverApplicationStatusResponse;
import com.beni.entity.DriverApplication;
import com.beni.entity.DriverApplicationCorrection;
import com.beni.entity.DriverApplicationStatus;
import com.beni.entity.User;
import com.beni.repository.DriverApplicationCorrectionRepository;
import com.beni.repository.DriverApplicationRepository;
import com.beni.repository.DriverRepository;
import com.beni.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

import java.time.Year;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class DriverApplicationResubmissionService {

    @Inject
    DriverApplicationRepository applicationRepository;

    @Inject
    DriverApplicationCorrectionRepository correctionRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    DriverRepository driverRepository;

    @Transactional
    public DriverApplicationCorrectionFormResponse getCorrectionForm(
            User user
    ) {
        validateApplicantAccount(user);

        DriverApplication application =
                applicationRepository.findLatestByUser(user);

        requireDeclinedApplication(application);

        DriverApplicationCorrectionFormResponse response =
                new DriverApplicationCorrectionFormResponse();

        response.success = true;
        response.message =
                "Correct the marked fields and submit a new application attempt.";

        response.applicationId =
                application.applicationId;
        response.attemptNumber =
                application.attemptNumber;

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

            item.fieldName =
                    correction.fieldName;
            item.instruction =
                    correction.instruction;

            response.corrections.add(item);
        }

        return response;
    }

    @Transactional
    public DriverApplicationStatusResponse resubmit(
            User user,
            DriverApplicationResubmitRequest request
    ) {
        validateApplicantAccount(user);
        validateAndNormalize(request);

        /*
         * Lock the latest stored attempt before calculating
         * the next attempt number.
         */
        DriverApplication lockedApplication =
                applicationRepository
                        .findLatestByUserForUpdate(user);

        requireDeclinedApplication(
                lockedApplication
        );

        /*
         * Query again after acquiring the lock. If another
         * request created a newer attempt while this request
         * was waiting, resubmission must stop.
         */
        DriverApplication latestApplication =
                applicationRepository
                        .findLatestByUser(user);

        if (
                latestApplication == null ||
                        !latestApplication.applicationId.equals(
                                lockedApplication.applicationId
                        )
        ) {
            throw new WebApplicationException(
                    "A newer driver application attempt already exists",
                    409
            );
        }

        requireDeclinedApplication(
                latestApplication
        );

        validateContactAvailability(
                user,
                request.phoneNumber,
                request.email
        );

        validateApplicationIdentifiers(
                request.cnicNumber,
                request.licenseNumber,
                request.vehiclePlateNumber,
                user.userId
        );

        DriverApplication newApplication =
                new DriverApplication();

        newApplication.user = user;
        newApplication.previousApplication =
                latestApplication;

        newApplication.attemptNumber =
                latestApplication.attemptNumber == null
                        ? applicationRepository
                        .nextAttemptNumber(user)
                        : latestApplication.attemptNumber + 1;

        newApplication.status =
                DriverApplicationStatus.PENDING_REVIEW;

        newApplication.fullName =
                request.fullName;
        newApplication.phoneNumber =
                request.phoneNumber;
        newApplication.email =
                request.email;
        newApplication.cnicNumber =
                request.cnicNumber;

        newApplication.licenseNumber =
                request.licenseNumber;

        newApplication.vehicleMake =
                request.vehicleMake;
        newApplication.vehicleModel =
                request.vehicleModel;
        newApplication.vehicleYear =
                request.vehicleYear;
        newApplication.vehicleColor =
                request.vehicleColor;
        newApplication.vehiclePlateNumber =
                request.vehiclePlateNumber;
        newApplication.vehicleCapacity =
                request.vehicleCapacity;

        applicationRepository.persist(
                newApplication
        );

        applicationRepository.flush();

        return buildPendingStatusResponse(
                newApplication
        );
    }

    private void validateApplicantAccount(
            User user
    ) {
        if (user == null) {
            throw new WebApplicationException(
                    "Applicant session is required",
                    401
            );
        }

        if (
                "SUSPENDED".equalsIgnoreCase(
                        user.accountStatus
                )
        ) {
            throw new WebApplicationException(
                    "This account is suspended",
                    403
            );
        }

        if (
                driverRepository.findByUser(user)
                        != null
        ) {
            throw new WebApplicationException(
                    "This account is already an approved driver",
                    409
            );
        }
    }

    private void requireDeclinedApplication(
            DriverApplication application
    ) {
        if (application == null) {
            throw new WebApplicationException(
                    "Driver application not found",
                    404
            );
        }

        if (
                application.status
                        == DriverApplicationStatus.PENDING_REVIEW
        ) {
            throw new WebApplicationException(
                    "A driver application is already under review",
                    409
            );
        }

        if (
                application.status
                        == DriverApplicationStatus.APPROVED
        ) {
            throw new WebApplicationException(
                    "This driver application is already approved",
                    409
            );
        }

        if (
                application.status
                        != DriverApplicationStatus.DECLINED
        ) {
            throw new WebApplicationException(
                    "Only a declined application can be corrected",
                    409
            );
        }
    }

    private void validateContactAvailability(
            User applicant,
            String phoneNumber,
            String email
    ) {
        User phoneUser =
                userRepository.findByPhoneNumber(
                        phoneNumber
                );

        if (
                phoneUser != null &&
                        !phoneUser.userId.equals(
                                applicant.userId
                        )
        ) {
            throw new WebApplicationException(
                    "This phone number belongs to another account",
                    409
            );
        }

        User emailUser =
                userRepository.findByEmail(
                        email
                );

        if (
                emailUser != null &&
                        !emailUser.userId.equals(
                                applicant.userId
                        )
        ) {
            throw new WebApplicationException(
                    "This email belongs to another account",
                    409
            );
        }
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

    private void validateAndNormalize(
            DriverApplicationResubmitRequest request
    ) {
        if (request == null) {
            throw new WebApplicationException(
                    "Corrected application information is required",
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
        )
                .replace(" ", "")
                .replace("-", "");

        if (
                !request.phoneNumber.matches(
                        "^03[0-9]{9}$"
                )
        ) {
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
                request.email.length() > 100 ||
                        !request.email.matches(
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
        )
                .replace("-", "")
                .replace(" ", "");

        if (
                !request.cnicNumber.matches(
                        "^[0-9]{13}$"
                )
        ) {
            throw new WebApplicationException(
                    "CNIC number must contain exactly 13 digits",
                    400
            );
        }

        request.licenseNumber = required(
                request.licenseNumber,
                "Licence number"
        ).toUpperCase(Locale.ROOT);

        if (
                request.licenseNumber.length() > 50
        ) {
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

        if (
                request.vehicleMake.length() > 50 ||
                        request.vehicleModel.length() > 50 ||
                        request.vehicleColor.length() > 30 ||
                        request.vehiclePlateNumber.length() > 20
        ) {
            throw new WebApplicationException(
                    "One or more vehicle fields are too long",
                    400
            );
        }

        int maximumYear =
                Year.now().getValue() + 1;

        if (
                request.vehicleYear == null ||
                        request.vehicleYear < 2000 ||
                        request.vehicleYear > maximumYear
        ) {
            throw new WebApplicationException(
                    "Vehicle year is invalid",
                    400
            );
        }

        if (
                request.vehicleCapacity == null ||
                        request.vehicleCapacity <= 0
        ) {
            throw new WebApplicationException(
                    "Vehicle capacity must be greater than zero",
                    400
            );
        }
    }

    private DriverApplicationStatusResponse
    buildPendingStatusResponse(
            DriverApplication application
    ) {
        DriverApplicationStatusResponse response =
                new DriverApplicationStatusResponse();

        response.success = true;
        response.userId =
                application.user.userId;
        response.applicationId =
                application.applicationId;
        response.attemptNumber =
                application.attemptNumber;
        response.applicationStatus =
                application.status.name();

        response.reviewSummary = null;
        response.submittedAt =
                application.submittedAt;
        response.reviewedAt = null;

        response.canGoOnline = false;
        response.walletEnabled = false;
        response.canViewRideOffers = false;

        response.message =
                "Your corrected application has been submitted for admin review.";

        return response;
    }

    private String required(
            String value,
            String fieldName
    ) {
        if (
                value == null ||
                        value.isBlank()
        ) {
            throw new WebApplicationException(
                    fieldName + " is required",
                    400
            );
        }

        return value.trim();
    }
}