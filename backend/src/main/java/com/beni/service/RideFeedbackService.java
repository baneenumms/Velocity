package com.beni.service;

import com.beni.dto.*;
import com.beni.entity.*;
import com.beni.repository.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

@ApplicationScoped
public class RideFeedbackService {

    @Inject RideRepository rideRepository;
    @Inject RideFeedbackRepository feedbackRepository;

    @Transactional
    public RideFeedbackResponse submit(
            RideFeedbackRequest input
    ) {
        require(input != null, "Request body is required");

        Ride ride = input.rideId == null
                ? null
                : rideRepository.findById(
                input.rideId.longValue()
        );

        require(ride != null, "Ride not found");

        require(
                ride.rideStatus == RideStatus.COMPLETED,
                "Feedback is allowed only after completion"
        );

        String role = normalizeRole(input.submittedBy);

        if ("PASSENGER".equals(role)) {
            require(
                    input.passengerId != null &&
                            ride.passenger.passengerId.equals(
                                    input.passengerId
                            ),
                    "Passenger does not belong to this ride"
            );
        } else {
            require(
                    input.driverId != null &&
                            ride.driver.driverId.equals(input.driverId),
                    "Driver does not belong to this ride"
            );
        }

        require(
                input.rating == null ||
                        input.rating >= 1 && input.rating <= 5,
                "Rating must be between 1 and 5"
        );

        String comment = clean(input.comment);
        String category = clean(input.reportCategory);

        require(
                input.rating != null ||
                        comment != null ||
                        category != null,
                "Add a rating, comment or report"
        );

        require(
                feedbackRepository.findExisting(
                        input.rideId,
                        role
                ) == null,
                "Feedback was already submitted"
        );

        RideFeedback feedback = new RideFeedback();

        feedback.ride = ride;
        feedback.submittedBy = role;
        feedback.rating = input.rating;
        feedback.comment = comment;
        feedback.reportCategory = category;

        feedbackRepository.persist(feedback);
        feedbackRepository.flush();

        RideFeedbackResponse response =
                new RideFeedbackResponse();

        response.success = true;
        response.message = "Feedback submitted";
        response.feedbackId = feedback.feedbackId;

        return response;
    }

    private String normalizeRole(String value) {
        String role = value == null
                ? ""
                : value.trim().toUpperCase();

        require(
                role.equals("PASSENGER") ||
                        role.equals("DRIVER"),
                "submittedBy must be PASSENGER or DRIVER"
        );

        return role;
    }

    private String clean(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }

    private void require(
            boolean condition,
            String message
    ) {
        if (!condition) {
            throw new WebApplicationException(message, 400);
        }
    }
}